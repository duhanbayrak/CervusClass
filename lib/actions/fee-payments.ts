'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { FeePayment, PaymentMethod } from '@/types/accounting';
import type { SupabaseClient } from '@supabase/supabase-js';

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
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || 'Yetkilendirme hatası' };

    // 1. Taksit tutarı kontrolü (Eğer bir taksite istinaden ödeme yapılıyorsa)
    if (payment.installment_id) {
        const { data: checkInst } = await supabase
            .from('fee_installments')
            .select('amount, paid_amount')
            .eq('id', payment.installment_id)
            .single();

        if (checkInst) {
            const remaining = Number(checkInst.amount) - Number(checkInst.paid_amount);
            if (payment.amount > remaining) {
                return {
                    success: false,
                    error: `Tahsilat tutarı aşımı! Bu taksit için en fazla ${remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ödeme alınabilir.`
                };
            }
        }
    }

    // 2. Ödeme kaydını oluştur
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

    await recordPaymentTransaction(supabase, organizationId, user.id, payment, paymentDate, insertedPayment?.id)
    await updateInstallmentStatus(supabase, payment.installment_id, payment.amount)

    return { success: true, paymentId: insertedPayment?.id };
}

async function getOrCreateStudentFeeCategory(supabase: SupabaseClient, organizationId: string): Promise<string | null> {
    const { data: existing } = await supabase.from('finance_categories').select('id')
        .eq('organization_id', organizationId).eq('name', 'Öğrenci Ücreti').eq('type', 'income').maybeSingle()
    if (existing?.id) return existing.id
    const { data: newCat } = await supabase.from('finance_categories')
        .insert({ organization_id: organizationId, name: 'Öğrenci Ücreti', type: 'income', icon: '🎓' })
        .select('id').single()
    return newCat?.id || null
}

async function getVatForInstallment(supabase: SupabaseClient, installmentId: string, amount: number) {
    const { data: instData } = await supabase.from('fee_installments')
        .select('fee_id, student_fees ( vat_rate )').eq('id', installmentId).single() as { data: { student_fees: { vat_rate?: number } } | null }
    const vatRate = Number(instData?.student_fees?.vat_rate || 0)
    if (vatRate <= 0) return { vat_rate: 0, subtotal: amount, vat_amount: 0 }
    const subtotal = Number((amount / (1 + vatRate / 100)).toFixed(2))
    return { vat_rate: vatRate, subtotal, vat_amount: Number((amount - subtotal).toFixed(2)) }
}

async function recordPaymentTransaction(
    supabase: SupabaseClient,
    organizationId: string,
    userId: string,
    payment: { student_id: string; installment_id?: string; account_id: string; amount: number; notes?: string; reference_no?: string },
    paymentDate: string,
    paymentId?: string
): Promise<void> {
    const categoryId = await getOrCreateStudentFeeCategory(supabase, organizationId)
    if (!categoryId) return

    const { data: studentProfile } = await supabase.from('profiles').select('full_name').eq('id', payment.student_id).single()
    const studentName = studentProfile?.full_name || 'Öğrenci'
    const description = payment.notes || `${studentName} - Taksit ödemesi`

    const vatData = payment.installment_id
        ? await getVatForInstallment(supabase, payment.installment_id, payment.amount)
        : { vat_rate: 0, subtotal: payment.amount, vat_amount: 0 }

    await supabase.from('finance_transactions').insert({
        organization_id: organizationId,
        account_id: payment.account_id,
        category_id: categoryId,
        type: 'income',
        amount: payment.amount,
        subtotal: vatData.subtotal,
        vat_rate: vatData.vat_rate,
        vat_amount: vatData.vat_amount,
        description,
        transaction_date: paymentDate,
        reference_no: payment.reference_no || null,
        related_payment_id: paymentId || null,
        created_by: userId,
    })
}

async function updateInstallmentStatus(supabase: SupabaseClient, installmentId: string | undefined, amount: number): Promise<void> {
    if (!installmentId) return
    const { data: installment } = await supabase.from('fee_installments').select('amount, paid_amount').eq('id', installmentId).single()
    if (!installment) return

    const newPaidAmount = Number(installment.paid_amount) + amount
    const newStatus: 'pending' | 'paid' | 'partial' = newPaidAmount >= Number(installment.amount) ? 'paid' : 'partial'

    await supabase.from('fee_installments').update({
        paid_amount: newPaidAmount, status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
    }).eq('id', installmentId)

    const { data: related } = await supabase.from('fee_installments').select('fee_id').eq('id', installmentId).single()
    if (!related) return
    const { data: allInstallments } = await supabase.from('fee_installments').select('status').eq('fee_id', related.fee_id)
    if (allInstallments?.every(i => i.status === 'paid')) {
        await supabase.from('student_fees').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', related.fee_id)
    }
}
