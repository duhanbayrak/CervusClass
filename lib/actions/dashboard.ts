'use server';

import { getAuthContext } from "@/lib/auth-context";

// Dashboard istatistikleri — tüm sorgular paralel çalışıyor
export async function getAdminDashboardStats() {
    const { supabase, error } = await getAuthContext();
    if (error) return null;

    try {
        // Sorgular paralel çalışsın — toplam süre en yavaş sorgunun süresi kadar
        const [students, teachers, classes] = await Promise.all([
            // Öğrenci sayısı
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role_id', '380914a0-783e-4300-8fb7-b55c81f575b7'),

            // Öğretmen sayısı
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role_id', 'cabce3da-842d-45f7-9fe0-3bc1634b11d3'),

            // Sınıf sayısı
            supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })
        ]);

        return {
            totalStudents: students.count || 0,
            totalTeachers: teachers.count || 0,
            totalClasses: classes.count || 0,
        };

    } catch {
        return {
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
        };
    }
}
