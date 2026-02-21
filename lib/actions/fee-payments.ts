'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { FeePayment, PaymentMethod } from '@/types/accounting';

/**
 * Ödeme kayıtlarını filtreli getirir.
 */
export async function getFeePayments(filters?: {
    student_id?: string;
    installment_id?: string;
    payment_method?: PaymentMethod;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}): Promise<{ data: FeePayment[]; count: number }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { data: [], count: 0 };

    let query = supabase
        .from('fee_payments')
        .select(`
            *,
            student:profiles!student_id(full_name),
            account:finance_accounts!account_id(name),
            created_by_profile:profiles!created_by(full_name)
        `, { count: 'exact' })
        .order('payment_date', { ascending: false });

    if (filters?.student_id) query = query.eq('student_id', filters.student_id);
    if (filters?.installment_id) query = query.eq('installment_id', filters.installment_id);
    if (filters?.payment_method) query = query.eq('payment_method', filters.payment_method);
    if (filters?.start_date) query = query.gte('payment_date', filters.start_date);
    if (filters?.end_date) query = query.lte('payment_date', filters.end_date);

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error: fetchError } = await query;
    if (fetchError) return { data: [], count: 0 };
    return { data: (data || []) as FeePayment[], count: count || 0 };
}

/**
 * Yeni ödeme kaydı oluşturur. Taksit ve hesap bakiyesini otomatik günceller.
 */
export async function createFeePayment(payment: {
    student_id: string;
    installment_id?: string;
    account_id: string;
    amount: number;
    payment_method: PaymentMethod;
    reference_no?: string;
    notes?: string;
    payment_date?: string;
}): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || 'Yetkilendirme hatası' };

    // 1. Ödeme kaydını oluştur
    const paymentDate = payment.payment_date || new Date().toISOString();

    const { data: insertedPayment, error: insertError } = await supabase
        .from('fee_payments')
        .insert({
            organization_id: organizationId,
            student_id: payment.student_id,
            installment_id: payment.installment_id || null,
            account_id: payment.account_id,
            amount: payment.amount,
            payment_method: payment.payment_method,
            reference_no: payment.reference_no || null,
            notes: payment.notes || null,
            created_by: user.id,
            payment_date: paymentDate,
        })
        .select('id')
        .single();

    if (insertError) return { success: false, error: insertError.message };

    // 1b. Muhasebe kaydı — "Öğrenci Ücreti" kategorisini bul veya oluştur
    let studentFeeCategoryId: string | null = null;

    const { data: existingCategory } = await supabase
        .from('finance_categories')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', 'Öğrenci Ücreti')
        .eq('type', 'income')
        .maybeSingle();

    if (existingCategory) {
        studentFeeCategoryId = existingCategory.id;
    } else {
        // Kategori yoksa oluştur
        const { data: newCategory } = await supabase
            .from('finance_categories')
            .insert({
                organization_id: organizationId,
                name: 'Öğrenci Ücreti',
                type: 'income',
                icon: '🎓',
            })
            .select('id')
            .single();

        studentFeeCategoryId = newCategory?.id || null;
    }

    // 1c. finance_transactions tablosuna gelir kaydı ekle
    if (studentFeeCategoryId) {
        // Öğrenci adını açıklama için çek
        const { data: studentProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payment.student_id)
            .single();

        const studentName = studentProfile?.full_name || 'Öğrenci';
        const description = payment.notes || `${studentName} - Taksit ödemesi`;

        await supabase
            .from('finance_transactions')
            .insert({
                organization_id: organizationId,
                account_id: payment.account_id,
                category_id: studentFeeCategoryId,
                type: 'income',
                amount: payment.amount,
                description,
                transaction_date: paymentDate,
                reference_no: payment.reference_no || null,
                related_payment_id: insertedPayment?.id || null,
                created_by: user.id,
            });
    }

    // 2. Taksit durumunu güncelle (eğer taksit belirtilmişse)
    if (payment.installment_id) {
        const { data: installment } = await supabase
            .from('fee_installments')
            .select('amount, paid_amount')
            .eq('id', payment.installment_id)
            .single();

        if (installment) {
            const newPaidAmount = Number(installment.paid_amount) + payment.amount;
            const installmentAmount = Number(installment.amount);

            // Taksit durumunu belirle
            let newStatus: 'pending' | 'paid' | 'partial' = 'partial';
            if (newPaidAmount >= installmentAmount) {
                newStatus = 'paid';
            }

            await supabase
                .from('fee_installments')
                .update({
                    paid_amount: newPaidAmount,
                    status: newStatus,
                    paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
                })
                .eq('id', payment.installment_id);

            // Fee durumunu kontrol et — tüm taksitler ödendiyse 'completed' yap
            const { data: relatedInstallment } = await supabase
                .from('fee_installments')
                .select('fee_id')
                .eq('id', payment.installment_id)
                .single();

            if (relatedInstallment) {
                const { data: allInstallments } = await supabase
                    .from('fee_installments')
                    .select('status')
                    .eq('fee_id', relatedInstallment.fee_id);

                if (allInstallments && allInstallments.every(i => i.status === 'paid')) {
                    await supabase
                        .from('student_fees')
                        .update({ status: 'completed', updated_at: new Date().toISOString() })
                        .eq('id', relatedInstallment.fee_id);
                }
            }
        }
    }

    // 3. Hesap bakiyesini güncelle
    const { data: account } = await supabase
        .from('finance_accounts')
        .select('balance')
        .eq('id', payment.account_id)
        .single();

    if (account) {
        const newBalance = Number(account.balance) + payment.amount;
        await supabase
            .from('finance_accounts')
            .update({ balance: newBalance })
            .eq('id', payment.account_id);
    }

    return { success: true };
}
