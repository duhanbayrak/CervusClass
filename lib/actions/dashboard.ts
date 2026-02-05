'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getAdminDashboardStats() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    try {
        // Teacher Role ID: cabce3da-842d-45f7-9fe0-3bc1634b11d3
        // Student Role ID: 380914a0-783e-4300-8fb7-b55c81f575b7

        // Get authentication check (optional but good for debugging RLS context)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // DEBUG: Check user's profile and org_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role_id')
            .eq('id', user.id)
            .single();

        console.log('DEBUG DASHBOARD:', {
            userId: user.id,
            profileOrg: profile?.organization_id,
            profileRole: profile?.role_id
        });

        // Run queries in parallel for performance
        const [students, teachers, classes] = await Promise.all([
            // Count Students
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role_id', '380914a0-783e-4300-8fb7-b55c81f575b7'),

            // Count Teachers
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role_id', 'cabce3da-842d-45f7-9fe0-3bc1634b11d3'),

            // Count Classes
            supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })
        ]);

        // Return debug info if stats are zero
        const isZero = (students.count || 0) + (teachers.count || 0) + (classes.count || 0) === 0;
        if (isZero) {
            return {
                totalStudents: 0,
                totalTeachers: 0,
                totalClasses: 0,
                debug: `User: ${user.id}, Org: ${profile?.organization_id}, Role: ${profile?.role_id}`
            };
        }

        return {
            totalStudents: students.count || 0,
            totalTeachers: teachers.count || 0,
            totalClasses: classes.count || 0,
        };

    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return {
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
            debug: error.message
        };
    }
}
