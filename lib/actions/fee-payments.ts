'use server';

import * as Sentry from '@sentry/nextjs';
import { getAuthContext } from '@/lib/auth-context';
import type { FeePayment, PaymentMethod } from '@/types/accounting';
import { format } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getOrCreateStudentFeeCategory } from '@/lib/actions/utils/finance-helpers';

// ============================================================
// OKUMA FONKSİYONLARI
// ============================================================

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

// ============================================================
// YAZMA FONKSİYONLARI
// ============================================================

/**
 * Yeni ödeme kaydı oluşturur.
 *
 * Tüm adımlar (fee_payments INSERT, finance_transactions INSERT,
 * fee_installments UPDATE, student_fees tamamlanma kontrolü)
 * tek bir PostgreSQL transaction içinde atomik olarak çalışır.
 * Herhangi bir adımda hata oluşursa tüm işlem otomatik geri alınır.
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
    if (error || !organizationId || !user) {
        return { success: false, error: error || 'Yetkilendirme hatası' };
    }

    // Muhasebe kategorisini hazırla (RPC içine taşınamaz — auth context gerektirir)
    const categoryId = await getOrCreateStudentFeeCategory(supabase, organizationId);
    if (!categoryId) {
        return { success: false, error: 'Muhasebe kategorisi oluşturulamadı.' };
    }

    // Öğrenci adını al (RPC description için)
    const { data: studentProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', payment.student_id)
        .single();
    const studentName = studentProfile?.full_name || 'Öğrenci';

    // KDV bilgilerini hesapla (taksit varsa)
    const vatData = payment.installment_id
        ? await getVatForInstallment(supabase, payment.installment_id, payment.amount)
        : { vat_rate: 0, subtotal: payment.amount, vat_amount: 0 };

    // Ödeme tarihini normalize et
    const paymentDate = payment.payment_date
        ? format(new Date(payment.payment_date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

    // Atomik RPC çağrısı — tüm DB işlemleri tek transaction'da.
    // NOT: create_fee_payment_atomic yeni eklenmiş bir fonksiyon olduğundan
    // Supabase'in otomatik tip dosyasına henüz yansımamıştır.
    // Tip güncellemesi için: supabase gen types typescript --project-id <id>
    const { data: rpcResult, error: rpcError } = await (
        supabase.rpc as unknown as (
            fn: string,
            args: Record<string, unknown>
        ) => Promise<{ data: unknown; error: { message: string } | null }>
    )('create_fee_payment_atomic', {
        p_organization_id: organizationId,
        p_student_id: payment.student_id,
        p_installment_id: payment.installment_id || null,
        p_account_id: payment.account_id,
        p_amount: payment.amount,
        p_payment_method: payment.payment_method,
        p_reference_no: payment.reference_no || null,
        p_notes: payment.notes || null,
        p_payment_date: paymentDate,
        p_created_by: user.id,
        p_category_id: categoryId,
        p_student_name: studentName,
        p_vat_rate: vatData.vat_rate,
        p_subtotal: vatData.subtotal,
        p_vat_amount: vatData.vat_amount,
    });

    if (rpcError) {
        Sentry.withScope((scope) => {
            scope.setTag('action', 'fee_payment:create')
            scope.setTag('organization_id', organizationId)
            scope.setUser({ id: user.id })
            scope.setExtra('student_id', payment.student_id)
            scope.setExtra('amount', payment.amount)
            scope.setLevel('error')
            Sentry.captureException(new Error(rpcError.message))
        })
        return { success: false, error: rpcError.message };
    }

    if (!rpcResult) {
        return { success: false, error: 'RPC boş sonuç döndürdü.' };
    }

    // RPC JSONB sonucunu parse et
    const result = rpcResult as { success: boolean; payment_id?: string; error?: string };

    if (!result.success) {
        return { success: false, error: result.error || 'Ödeme kaydedilemedi.' };
    }

    return { success: true, paymentId: result.payment_id };
}

/**
 * Mevcut bir ödeme kaydını iptal eder / geri alır.
 *
 * Atomik RPC fonksiyonu çağrılarak, tahsilat, muhasebe kaydı ve taksit durumu
 * güvenli bir şekilde tek işlemde geri alınır.
 */
export async function cancelFeePayment(
    paymentId: string,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) {
        return { success: false, error: error || 'Yetkilendirme hatası' };
    }

    // Atomik RPC çağrısı
    const { data: rpcResult, error: rpcError } = await (
        supabase.rpc as unknown as (
            fn: string,
            args: Record<string, unknown>
        ) => Promise<{ data: unknown; error: { message: string } | null }>
    )('cancel_fee_payment_atomic', {
        p_payment_id: paymentId,
        p_organization_id: organizationId,
        p_cancelled_by: user.id,
        p_reason: reason || null,
    });

    if (rpcError) {
        Sentry.withScope((scope) => {
            scope.setTag('action', 'fee_payment:cancel')
            scope.setTag('organization_id', organizationId)
            scope.setUser({ id: user.id })
            scope.setExtra('payment_id', paymentId)
            scope.setLevel('error')
            Sentry.captureException(new Error(rpcError.message))
        })
        return { success: false, error: rpcError.message };
    }

    if (!rpcResult) {
        return { success: false, error: 'RPC boş sonuç döndürdü.' };
    }

    const result = rpcResult as { success: boolean; error?: string };

    if (!result.success) {
        return { success: false, error: result.error || 'Ödeme iptal edilemedi.' };
    }

    return { success: true };
}

// ============================================================
// ÖZEL YARDIMCI FONKSİYONLAR
// ============================================================



/**
 * Taksit kaydından KDV oranını çekip verilen tutar için
 * KDV dağılımını hesaplar.
 */
async function getVatForInstallment(
    supabase: SupabaseClient,
    installmentId: string,
    amount: number
): Promise<{ vat_rate: number; subtotal: number; vat_amount: number }> {
    const { data } = await supabase
        .from('fee_installments')
        .select('fee_id, student_fees ( vat_rate )')
        .eq('id', installmentId)
        .single();

    // Supabase foreign tablolardan array ya da tek obje dönebilir.
    const instData = data as unknown as { student_fees?: { vat_rate?: number } | { vat_rate?: number }[] | null } | null;
    const sFee = Array.isArray(instData?.student_fees) ? instData?.student_fees[0] : instData?.student_fees;
    const vatRate = Number(sFee?.vat_rate || 0);

    if (vatRate <= 0) {
        return { vat_rate: 0, subtotal: amount, vat_amount: 0 };
    }

    const subtotal = Number((amount / (1 + vatRate / 100)).toFixed(2));
    return {
        vat_rate: vatRate,
        subtotal,
        vat_amount: Number((amount - subtotal).toFixed(2)),
    };
}
