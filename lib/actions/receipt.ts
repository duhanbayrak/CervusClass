'use server';

import { getAuthContext } from '@/lib/auth-context';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { numberToWordsTR } from '@/lib/utils/number-to-words';

export interface ReceiptData {
    receiptNumber: string;
    dateFormatted: string;
    organization: {
        name: string;
        logo_url: string | null;
        logo_base64: string | null;  // CORS sorununu aşmak için server'da base64'e çevrilir
        address: string | null;
        phone: string | null;
    };
    student: {
        fullName: string;
        parentName: string | null;
        tcNo: string | null;
    };
    payment: {
        id: string;
        amount: number;
        amountWords: string;
        method: string;
        referenceNo: string | null;
        notes: string | null;
    };
    details: {
        serviceName: string;
        academicPeriod: string;
    };
    financials: {
        totalDebt: number;
        totalPaid: number;
        remainingDebt: number;
    };
    operator: {
        fullName: string;
    };
}

type SupabaseClient = Awaited<ReturnType<typeof getAuthContext>>['supabase'];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Nakit',
    bank_transfer: 'Havale / EFT',
    credit_card: 'Kredi Kartı',
    other: 'Diğer',
};

async function resolvePaymentId(
    supabase: SupabaseClient,
    paymentId?: string,
    installmentId?: string
): Promise<{ id: string } | { error: string }> {
    if (paymentId) return { id: paymentId };
    if (!installmentId) return { error: 'paymentId veya installmentId gerekli.' };

    const { data: latestPayment, error: lpErr } = await supabase
        .from('fee_payments')
        .select('id')
        .eq('installment_id', installmentId)
        .order('payment_date', { ascending: false })
        .limit(1)
        .single();

    if (lpErr || !latestPayment) return { error: 'Bu taksit için ödeme kaydı bulunamadı.' };
    return { id: latestPayment.id };
}

async function fetchLogoBase64(logoUrl: string): Promise<string | null> {
    try {
        const logoResponse = await fetch(logoUrl);
        if (!logoResponse.ok) return null;
        const buffer = await logoResponse.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = logoResponse.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${base64}`;
    } catch {
        return null;
    }
}

async function buildReceiptResult(
    supabase: SupabaseClient,
    organizationId: string,
    paymentData: Record<string, unknown>
): Promise<ReceiptData> {
    const orgData = await supabase
        .from('organizations')
        .select('name, logo_url, address, phone')
        .eq('id', organizationId)
        .single()
        .then(r => r.data) as Record<string, unknown> | null;

    const logoBase64 = orgData?.logo_url ? await fetchLogoBase64(orgData.logo_url as string) : null;

    const { count } = await supabase
        .from('fee_payments')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .lte('payment_date', paymentData.payment_date as string);

    const sequence = count ? String(count).padStart(6, '0') : '000001';
    const year = new Date(paymentData.payment_date as string).getFullYear();
    const receiptNumber = `MKB-${year}-${sequence}`;

    const { totalDebt, totalPaid, remainingDebt, serviceName, academicPeriod } = await calcReceiptFinancials(supabase, paymentData);

    const student = paymentData.student as Record<string, unknown> | null;
    const operator = paymentData.operator as Record<string, unknown> | null;

    return {
        receiptNumber,
        dateFormatted: format(new Date(paymentData.payment_date as string), 'dd MMMM yyyy HH:mm', { locale: tr }),
        organization: {
            name: (orgData?.name as string) || 'Kurum Adı',
            logo_url: (orgData?.logo_url as string) || null,
            logo_base64: logoBase64,
            address: (orgData?.address as string) || null,
            phone: (orgData?.phone as string) || null,
        },
        student: {
            fullName: (student?.full_name as string) || 'Bilinmiyor',
            parentName: (student?.parent_name as string) || null,
            tcNo: (student?.tc_no as string) || null,
        },
        payment: {
            id: paymentData.id as string,
            amount: Number(paymentData.amount),
            amountWords: numberToWordsTR(Number(paymentData.amount)),
            method: PAYMENT_METHOD_LABELS[paymentData.payment_method as string] || 'Diğer',
            referenceNo: (paymentData.reference_no as string) || null,
            notes: (paymentData.notes as string) || null,
        },
        details: { serviceName, academicPeriod },
        financials: { totalDebt, totalPaid, remainingDebt },
        operator: { fullName: (operator?.full_name as string) || 'Bilinmiyor' },
    };
}

export async function getReceiptData(
    paymentId?: string,
    installmentId?: string
): Promise<{ success: boolean; data?: ReceiptData; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();

    if (error || !organizationId) return { success: false, error: 'Yetkilendirme hatası' };
    if (!paymentId && !installmentId) return { success: false, error: 'paymentId veya installmentId gerekli.' };

    try {
        const resolved = await resolvePaymentId(supabase, paymentId, installmentId);
        if ('error' in resolved) return { success: false, error: resolved.error };

        const { data: paymentData, error: paymentError } = await supabase
            .from('fee_payments')
            .select(`
                *,
                installment:fee_installments!installment_id (
                    fee_id,
                    student_fees:fee_id (
                        total_amount,
                        discount_amount,
                        net_amount,
                        academic_period,
                        finance_services:service_id (name)
                    )
                ),
                student:profiles!student_id (full_name, parent_name, tc_no),
                operator:profiles!created_by (full_name)
            `)
            .eq('id', resolved.id)
            .single() as { data: Record<string, unknown> | null; error: unknown };

        if (paymentError || !paymentData) return { success: false, error: 'Ödeme kaydı bulunamadı.' };

        const result = await buildReceiptResult(supabase, organizationId, paymentData);
        return { success: true, data: result };

    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Beklenmedik hata' };
    }
}

async function calcReceiptFinancials(supabase: Awaited<ReturnType<typeof import('@/lib/auth-context').getAuthContext>>['supabase'], paymentData: Record<string, unknown>) {
    const installment = paymentData.installment as { fee_id?: string; student_fees?: { net_amount?: number; academic_period?: string; finance_services?: { name?: string } } } | null
    if (installment?.student_fees) {
        const fee = installment.student_fees
        const totalDebt = Number(fee.net_amount) || 0
        const academicPeriod = fee.academic_period || 'Belirtilmiyor'
        const serviceName = fee.finance_services?.name || 'Öğrenci Ücreti'
        const { data: allInstallments } = await supabase.from('fee_installments').select('paid_amount').eq('fee_id', installment.fee_id!)
        const totalPaid = (allInstallments || []).reduce((sum, inst) => sum + Number(inst.paid_amount || 0), 0)
        const remainingDebt = Math.max(0, totalDebt - totalPaid)
        return { totalDebt, totalPaid, remainingDebt, serviceName, academicPeriod }
    }
    const amount = Number(paymentData.amount)
    return { totalDebt: amount, totalPaid: amount, remainingDebt: 0, serviceName: 'Genel Tahsilat', academicPeriod: 'Belirtilmiyor' }
}
