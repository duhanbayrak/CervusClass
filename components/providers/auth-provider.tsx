'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from "@/lib/supabase";
import { Profile, ProfileRole } from '@/types/database';

const supabase = createClient();

export interface OrganizationData {
    name: string;
    logo_url: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    role: ProfileRole | null;
    organization: OrganizationData | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * JWT metadata'dan profil oluşturur (anında, DB sorgusu beklemeden)
 */
function profileFromJwt(authUser: User): Profile {
    const meta = authUser.user_metadata || {};
    const appMeta = authUser.app_metadata || {};
    return {
        id: authUser.id,
        full_name: meta.full_name || authUser.email?.split('@')[0] || 'Kullanıcı',
        email: authUser.email || '',
        organization_id: appMeta.organization_id || null,
        role_id: null,
        roles: appMeta.role ? { name: appMeta.role } : null,
        avatar_url: meta.avatar_url || null,
        class_id: appMeta.class_id || null,
        branch_id: appMeta.branch_id || null,
        created_at: '',
        phone: null,
        student_number: null,
        parent_name: null,
        parent_phone: null,
        birth_date: null,
        bio: null,
        title: null,
        start_date: null,
        deleted_at: null,
        search_vector: null,
    } as unknown as Profile;
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) { // NOSONAR
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        // Güvenlik timeout
        const safetyTimeout = setTimeout(() => {
            if (mounted) setLoading(false);
        }, 5000);

        // DB'den profili çeker — doğrudan PostgREST fetch ile (client library bypass)
        const fetchDbProfile = async (userId: string, accessToken: string) => {
            try {
                const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=*,roles(name),organizations(name,logo_url)&id=eq.${userId}`;
                const res = await fetch(url, {
                    headers: {
                        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!res.ok) return null;

                const rows = await res.json();
                if (!rows || rows.length === 0) return null;
                return rows[0] as Profile;
            } catch {
                return null;
            }
        };

        // Auth state değişikliklerini dinle (tek kaynak)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }

            if (session?.user) {
                const authUser = session.user;
                setUser(authUser);

                // 1. ANINDA: JWT metadata'dan profil göster
                setProfile(profileFromJwt(authUser));
                setLoading(false);

                // 2. ARKA PLAN: DB'den tam profil çekmeye çalış (direct fetch)
                const dbProfile = await fetchDbProfile(authUser.id, session.access_token);
                if (mounted && dbProfile) {
                    setProfile(dbProfile);
                }
            } else {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            controller.abort();
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await Promise.race([
                supabase.auth.signOut(),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
        } catch {
            // Çıkış hatası
        } finally {
            setUser(null);
            setProfile(null);
            globalThis.location.href = '/';
        }
    };

    // Rol bilgisini profil verisinden çıkar
    const rolesData = (profile as any)?.roles as { name: string } | { name: string }[] | null;
    const roleName = Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name;

    // Organizasyon bilgisini profil verisinden çıkar
    const orgData = (profile as any)?.organizations as OrganizationData | null;

    const value = useMemo(() => ({
        user,
        profile,
        role: (roleName as ProfileRole) || null,
        organization: orgData || null,
        loading,
        signOut,
    }), [user, profile, roleName, orgData, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUserRole = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUserRole must be used within an AuthProvider');
    }
    return context;
};
