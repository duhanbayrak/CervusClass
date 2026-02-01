'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile, ProfileRole } from '@/types/database';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    role: ProfileRole | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 1. Check active session
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth check error:', error);
                setLoading(false);
            }
        };

        checkUser();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);

            if (session?.user) {
                setUser(session.user);
                if (!profile) { // Only fetch if not already loaded to avoid loops
                    await fetchProfile(session.user.id);
                } else {
                    setLoading(false); // Just in case
                }
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    roles!inner (
                        name
                    )
                `)
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data as any); // Type assertion until types are fully updated
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setUser(null);
            setProfile(null);
            // Force full page reload to clear all application state and cache
            window.location.href = '/';
        }
    };

    const value = {
        user,
        profile,
        // @ts-ignore
        role: (profile?.roles?.name as ProfileRole) || null,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUserRole = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUserRole must be used within an AuthProvider');
    }
    return context;
};
