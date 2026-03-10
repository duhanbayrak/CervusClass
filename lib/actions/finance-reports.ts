'use server';

import { getAuthContext } from '@/lib/auth-context';
import { logger } from '@/lib/logger';
import type {
    FinancialSummary,
    MonthlyTrend,
    CategoryDistribution,
    OverdueInstallment,
} from '@/types/accounting';
import { getDateRange } from '@/lib/utils/date';
import { format } from 'date-fns';

/**
 * Finansal dashboard özet verilerini getirir.
 * Optimizasyon: Büyük veri çekmek yerine veritabanı üzerindeki get_financial_summary RPC'sini çağırır.
 */
export async function getFinancialSummary(period: string = 'yearly'): Promise<FinancialSummary> {
    const { supabase, organizationId, error } = await getAuthContext();
    const defaultSummary: FinancialSummary = {
        total_income: 0,
        total_income_vat: 0,
        total_expense: 0,
        total_expense_vat: 0,
        net_profit: 0,
        net_vat: 0,
        total_vat: 0,
        collected_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
        collection_rate: 0,
    };

    if (error || !organizationId) return defaultSummary;

    const { startDate, endDate } = getDateRange(period);

    // Yeni RPC: Atomik ve %100 Database-Tier çalışan hesaplama
    const { data, error: rpcError } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: FinancialSummary, error: unknown }>)(
        'get_financial_summary',
        { p_org_id: organizationId, p_start_date: startDate, p_end_date: endDate }
    );

    if (rpcError || !data) {
        logger.error('getFinancialSummary RPC Hatası', { action: 'finance_report:financial_summary', organizationId }, rpcError)
        return defaultSummary;
    }

    return data;
}

/**
 * Aylık gelir-gider trend verilerini getirir.
 * Optimizasyon: get_monthly_trends RPC'si ile hızlı aggregate dönüşü sağlar.
 */
export async function getMonthlyTrends(period: string = 'yearly'): Promise<MonthlyTrend[]> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return [];

    const { startDate: periodStart } = getDateRange(period);
    const currentYear = Number.parseInt(periodStart.substring(0, 4), 10);

    const { data, error: rpcError } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: MonthlyTrend[], error: unknown }>)(
        'get_monthly_trends',
        { p_org_id: organizationId, p_year: currentYear }
    );

    if (rpcError || !data) {
        logger.error('getMonthlyTrends RPC Hatası', { action: 'finance_report:monthly_trends', organizationId }, rpcError)
        return [];
    }

    return data;
}

/**
 * Kategori bazlı gelir/gider dağılımını getirir.
 * Optimizasyon: get_category_distribution RPC'si kullanıldı.
 */
export async function getCategoryDistribution(type: 'income' | 'expense', period: string = 'yearly'): Promise<CategoryDistribution[]> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return [];

    const { startDate, endDate } = getDateRange(period);

    const { data, error: rpcError } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: CategoryDistribution[], error: unknown }>)(
        'get_category_distribution',
        { p_org_id: organizationId, p_type: type, p_start_date: startDate, p_end_date: endDate }
    );

    if (rpcError || !data) {
        logger.error('getCategoryDistribution RPC Hatası', { action: 'finance_report:category_distribution', organizationId }, rpcError)
        return [];
    }

    return data;
}

/**
 * Vadesi geçmiş taksitleri getirir.
 */
export async function getOverdueInstallments(): Promise<OverdueInstallment[]> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return [];

    const today = format(new Date(), 'yyyy-MM-dd');

    // Vadesi geçmiş ama ödenmemiş taksitleri bul
    const { data } = await supabase
        .from('fee_installments')
        .select(`
            id,
            amount,
            paid_amount,
            due_date,
            fee:student_fees!fee_id(
                student:profiles!student_id(id, full_name)
            )
        `)
        .eq('organization_id', organizationId) // Explicit tenant filtresi
        .in('status', ['pending', 'overdue', 'partial'])
        .lt('due_date', today)
        .order('due_date', { ascending: true });

    if (!data) return [];

    return data.map(installment => {
        const feeData = installment.fee as unknown as {
            student: { id: string; full_name: string | null };
        };
        const dueDate = new Date(installment.due_date);
        const todayDate = new Date(today);
        const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
            installment_id: installment.id,
            student_name: feeData?.student?.full_name || 'Bilinmeyen',
            student_id: feeData?.student?.id || '',
            amount: Number(installment.amount) - Number(installment.paid_amount),
            due_date: installment.due_date,
            days_overdue: daysOverdue,
        };
    });
}
