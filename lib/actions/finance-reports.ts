'use server';

import { getAuthContext } from '@/lib/auth-context';
import type {
    FinancialSummary,
    MonthlyTrend,
    CategoryDistribution,
    OverdueInstallment,
} from '@/types/accounting';

/**
 * Finansal dashboard özet verilerini getirir.
 */
export async function getFinancialSummary(period?: {
    year?: number;
}): Promise<FinancialSummary> {
    const { supabase, error } = await getAuthContext();
    const defaultSummary: FinancialSummary = {
        total_income: 0,
        total_expense: 0,
        net_profit: 0,
        collected_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
        collection_rate: 0,
    };

    if (error) return defaultSummary;

    const year = period?.year || new Date().getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Paralel sorgular
    const [incomeResult, expenseResult, collectedResult, pendingResult, overdueResult, feePaymentsResult] = await Promise.all([
        // Toplam gelir
        supabase
            .from('finance_transactions')
            .select('amount')
            .eq('type', 'income')
            .is('deleted_at', null)
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate),

        // Toplam gider
        supabase
            .from('finance_transactions')
            .select('amount')
            .eq('type', 'expense')
            .is('deleted_at', null)
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate),

        // Tahsil edilen (ödenen taksitler)
        supabase
            .from('fee_installments')
            .select('paid_amount')
            .eq('status', 'paid'),

        // Bekleyen (pending taksitler)
        supabase
            .from('fee_installments')
            .select('amount, paid_amount')
            .eq('status', 'pending'),

        // Vadesi geçmiş
        supabase
            .from('fee_installments')
            .select('amount, paid_amount')
            .eq('status', 'overdue'),

        // Öğrenci Ödemeleri (Gelir kalemi olarak eklenmek üzere)
        supabase
            .from('fee_payments')
            .select('amount')
            .gte('payment_date', startDate)
            .lte('payment_date', endDate), // fee_payments'te payment_date var, transaction_date yok
    ]);

    // Toplamları hesapla
    // Manuel gelirler + Öğrenci ödemeleri
    const feePaymentsTotal = (feePaymentsResult?.data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalIncome = (incomeResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0) + feePaymentsTotal;
    const totalExpense = (expenseResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0);
    const collectedAmount = (collectedResult.data || []).reduce((sum, i) => sum + Number(i.paid_amount), 0);
    const pendingRaw = (pendingResult.data || []).reduce((sum, i) => sum + (Number(i.amount) - Number(i.paid_amount)), 0);
    const overdueRaw = (overdueResult.data || []).reduce((sum, i) => sum + (Number(i.amount) - Number(i.paid_amount)), 0);
    const totalExpected = collectedAmount + pendingRaw + overdueRaw;
    const collectionRate = totalExpected > 0 ? Math.round((collectedAmount / totalExpected) * 100) : 0;

    return {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_profit: totalIncome - totalExpense,
        collected_amount: collectedAmount,
        pending_amount: pendingRaw,
        overdue_amount: overdueRaw,
        collection_rate: collectionRate,
    };
}

/**
 * Aylık gelir-gider trend verilerini getirir (12 ay).
 */
export async function getMonthlyTrends(year?: number): Promise<MonthlyTrend[]> {
    const { supabase, error } = await getAuthContext();
    if (error) return [];

    const currentYear = year || new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    const { data: transactions } = await supabase
        .from('finance_transactions')
        .select('type, amount, transaction_date')
        .is('deleted_at', null)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .in('type', ['income', 'expense']);

    const { data: feePayments } = await supabase
        .from('fee_payments')
        .select('amount, payment_date')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

    if (!transactions) return [];

    // 12 aylık boş veri oluştur
    const months: Record<string, MonthlyTrend> = {};
    for (let m = 1; m <= 12; m++) {
        const key = `${currentYear}-${String(m).padStart(2, '0')}`;
        months[key] = { month: key, income: 0, expense: 0 };
    }

    // İşlemleri aylara dağıt
    if (transactions) {
        for (const tx of transactions) {
            const monthKey = tx.transaction_date.substring(0, 7); // "2026-01"
            if (months[monthKey]) {
                if (tx.type === 'income') {
                    months[monthKey].income += Number(tx.amount);
                } else {
                    months[monthKey].expense += Number(tx.amount);
                }
            }
        }
    }

    // Öğrenci ödemelerini gelir olarak ekle
    if (feePayments) {
        for (const payment of feePayments) {
            const monthKey = payment.payment_date.substring(0, 7); // "2026-01"
            if (months[monthKey]) {
                months[monthKey].income += Number(payment.amount);
            }
        }
    }

    return Object.values(months);
}

/**
 * Kategori bazlı gelir/gider dağılımını getirir.
 */
export async function getCategoryDistribution(type: 'income' | 'expense'): Promise<CategoryDistribution[]> {
    const { supabase, error } = await getAuthContext();
    if (error) return [];

    const { data: transactions } = await supabase
        .from('finance_transactions')
        .select(`
            amount,
            category:finance_categories!category_id(name, icon)
        `)
        .eq('type', type)
        .is('deleted_at', null);

    // Öğrenci ödemelerini çek (Sadece gelir raporuysa)
    let feePaymentsTotal = 0;
    if (type === 'income') {
        const { data: payments } = await supabase
            .from('fee_payments')
            .select('amount');

        if (payments) {
            feePaymentsTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        }
    }

    if ((!transactions || transactions.length === 0) && feePaymentsTotal === 0) return [];

    // Kategorilere göre grupla
    const categoryMap: Record<string, { name: string; icon: string | null; total: number }> = {};
    let grandTotal = 0;

    const safeTransactions = transactions || [];
    for (const tx of safeTransactions) {
        const catName = (tx.category as { name: string; icon: string | null })?.name || 'Bilinmeyen';
        const catIcon = (tx.category as { name: string; icon: string | null })?.icon || null;
        if (!categoryMap[catName]) {
            categoryMap[catName] = { name: catName, icon: catIcon, total: 0 };
        }
        categoryMap[catName].total += Number(tx.amount);
        grandTotal += Number(tx.amount);
    }

    // Eğitim Hizmetleri kategorisini ekle
    if (feePaymentsTotal > 0) {
        const catName = 'Eğitim Hizmetleri';
        if (!categoryMap[catName]) {
            categoryMap[catName] = { name: catName, icon: 'school', total: 0 };
        }
        categoryMap[catName].total += feePaymentsTotal;
        grandTotal += feePaymentsTotal;
    }

    return Object.values(categoryMap).map(cat => ({
        category_name: cat.name,
        category_icon: cat.icon,
        amount: cat.total,
        percentage: grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0,
    }));
}

/**
 * Vadesi geçmiş taksitleri getirir.
 */
export async function getOverdueInstallments(): Promise<OverdueInstallment[]> {
    const { supabase, error } = await getAuthContext();
    if (error) return [];

    const today = new Date().toISOString().split('T')[0];

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
        .in('status', ['pending', 'overdue'])
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
