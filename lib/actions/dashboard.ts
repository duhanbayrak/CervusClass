'use server';

import { startOfMonth, endOfMonth, format } from 'date-fns';
import { withAction } from '@/lib/actions/utils/with-action';

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
export const getAdminDashboardStats = withAction(async (ctx) => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const monthStartStr = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(now), 'yyyy-MM-dd');

    const [
        students,
        teachers,
        classes,
        delayedInstallments,
        monthInstallments,
        accounts,
        newStudents
    ] = await Promise.all([
        ctx.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', '380914a0-783e-4300-8fb7-b55c81f575b7'),
        ctx.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', 'cabce3da-842d-45f7-9fe0-3bc1634b11d3'),
        ctx.supabase.from('classes').select('id', { count: 'exact', head: true }),
        ctx.supabase.from('fee_installments').select('amount, paid_amount').in('status', ['pending', 'overdue', 'partial']).lt('due_date', todayStr),
        ctx.supabase.from('fee_installments').select('amount, paid_amount').in('status', ['pending', 'overdue', 'partial']).gte('due_date', monthStartStr).lte('due_date', monthEndStr),
        ctx.supabase.from('finance_accounts').select('balance').eq('is_active', true),
        ctx.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', '380914a0-783e-4300-8fb7-b55c81f575b7').gte('created_at', monthStartStr),
    ]);

    const delayedSum = (delayedInstallments.data || []).reduce((acc, curr) => acc + (Number(curr.amount) - Number(curr.paid_amount || 0)), 0);
    const thisMonthSum = (monthInstallments.data || []).reduce((acc, curr) => acc + (Number(curr.amount) - Number(curr.paid_amount || 0)), 0);
    const activeBalanceSum = (accounts.data || []).reduce((acc, curr) => acc + Number(curr.balance), 0);

    return {
        success: true,
        data: {
            totalStudents: students.count || 0,
            totalTeachers: teachers.count || 0,
            totalClasses: classes.count || 0,
            delayedPayments: delayedSum,
            expectedCollectionThisMonth: thisMonthSum,
            totalActiveBalance: activeBalanceSum,
            newRegistrations: newStudents.count || 0,
        } satisfies DashboardStats,
    };
});

