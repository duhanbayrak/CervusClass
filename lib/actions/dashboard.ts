'use server';

import { getAuthContext } from "@/lib/auth-context";
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    delayedPayments: number;
    expectedCollectionThisMonth: number;
    totalActiveBalance: number;
    newRegistrations: number;
}

// Dashboard istatistikleri — tüm sorgular paralel çalışıyor
export async function getAdminDashboardStats(): Promise<DashboardStats | null> {
    const { supabase, error } = await getAuthContext();
    if (error) return null;

    try {
        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');
        const monthStartStr = format(startOfMonth(now), 'yyyy-MM-dd');
        const monthEndStr = format(endOfMonth(now), 'yyyy-MM-dd');

        // Sorgular paralel çalışsın — toplam süre en yavaş sorgunun süresi kadar
        const [
            students,
            teachers,
            classes,
            delayedInstallments,
            monthInstallments,
            accounts,
            newStudents
        ] = await Promise.all([
            // 1. Öğrenci sayısı
            supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role_id', '380914a0-783e-4300-8fb7-b55c81f575b7'),

            // 2. Öğretmen sayısı
            supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role_id', 'cabce3da-842d-45f7-9fe0-3bc1634b11d3'),

            // 3. Sınıf sayısı
            supabase
                .from('classes')
                .select('id', { count: 'exact', head: true }),

            // 4. Gecikmiş Ödemeler (Vadesi Bugünden önceki tarih ve ödenmemiş/kısmi olanlar)
            supabase
                .from('fee_installments')
                .select('amount, paid_amount')
                .in('status', ['pending', 'overdue', 'partial'])
                .lt('due_date', todayStr),

            // 5. Bu Ay Beklenen Tahsilat (Bu ay içindeki ödenmemiş taksitler)
            supabase
                .from('fee_installments')
                .select('amount, paid_amount')
                .in('status', ['pending', 'overdue', 'partial'])
                .gte('due_date', monthStartStr)
                .lte('due_date', monthEndStr),

            // 6. Toplam Aktif Kasa Bakiyesi
            supabase
                .from('finance_accounts')
                .select('balance')
                .eq('is_active', true),

            // 7. Yeni Kayıtlar (Bu ay)
            supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role_id', '380914a0-783e-4300-8fb7-b55c81f575b7')
                .gte('created_at', monthStartStr)
        ]);

        // Finansal toplamları hesapla
        const delayedSum = (delayedInstallments.data || []).reduce((acc, curr) => acc + (Number(curr.amount) - Number(curr.paid_amount || 0)), 0);
        const thisMonthSum = (monthInstallments.data || []).reduce((acc, curr) => acc + (Number(curr.amount) - Number(curr.paid_amount || 0)), 0);
        const activeBalanceSum = (accounts.data || []).reduce((acc, curr) => acc + Number(curr.balance), 0);

        return {
            totalStudents: students.count || 0,
            totalTeachers: teachers.count || 0,
            totalClasses: classes.count || 0,
            delayedPayments: delayedSum,
            expectedCollectionThisMonth: thisMonthSum,
            totalActiveBalance: activeBalanceSum,
            newRegistrations: newStudents.count || 0
        };

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        return {
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
            delayedPayments: 0,
            expectedCollectionThisMonth: 0,
            totalActiveBalance: 0,
            newRegistrations: 0
        };
    }
}
