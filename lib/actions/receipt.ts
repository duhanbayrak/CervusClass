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

export async function getReceiptData(
    paymentId?: string,
    installmentId?: string
): Promise<{ success: boolean; data?: ReceiptData; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();

    if (error || !organizationId) {
        return { success: false, error: 'Yetkilendirme hatası' };
    }

    if (!paymentId && !installmentId) {
        return { success: false, error: 'paymentId veya installmentId gerekli.' };
    }

    try {
        // installmentId verilmişse, o taksitteki en son ödemeyi bul
        let resolvedPaymentId = paymentId;
        if (!resolvedPaymentId && installmentId) {
            const { data: latestPayment, error: lpErr } = await supabase
                .from('fee_payments')
                .select('id')
                .eq('installment_id', installmentId)
                .order('payment_date', { ascending: false })
                .limit(1)
                .single();

            if (lpErr || !latestPayment) {
                return { success: false, error: 'Bu taksit için ödeme kaydı bulunamadı.' };
            }
            resolvedPaymentId = latestPayment.id;
        }
        // 1. Ödeme, Taksit, Öğrenci, Onaylayan bilgisini çek
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
            .eq('id', resolvedPaymentId!)
            .single() as any;

        if (paymentError || !paymentData) {
            return { success: false, error: 'Ödeme kaydı bulunamadı.' };
        }

        // 2. Organizasyon bilgisini çek
        const { data: orgData } = await supabase
            .from('organizations')
            .select('name, logo_url, address, phone')
            .eq('id', organizationId)
            .single() as any;

        // Logo URL'yi server-side'da base64'e çevir (CORS sorununu önler)
        let logoBase64: string | null = null;
        if (orgData?.logo_url) {
            try {
                const logoResponse = await fetch(orgData.logo_url);
                if (logoResponse.ok) {
                    const buffer = await logoResponse.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString('base64');
                    const contentType = logoResponse.headers.get('content-type') || 'image/png';
                    logoBase64 = `data:${contentType};base64,${base64}`;
                }
            } catch {
                // Logo çekilemezse null kalacak, PDF'de gösterilmeyecek
                logoBase64 = null;
            }
        }

        // 4. Makbuz numarası
        const { count } = await supabase
            .from('fee_payments')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .lte('payment_date', paymentData.payment_date);

        const sequence = count ? String(count).padStart(6, '0') : '000001';
        const year = new Date(paymentData.payment_date).getFullYear();
        const receiptNumber = `MKB-${year}-${sequence}`;

        const financialSummary = await calcReceiptFinancials(supabase, paymentData)
        const { totalDebt, totalPaid, remainingDebt, serviceName, academicPeriod } = financialSummary

        const methodMap: Record<string, string> = {
            'cash': 'Nakit',
            'bank_transfer': 'Havale / EFT',
            'credit_card': 'Kredi Kartı',
            'other': 'Diğer'
        };

        const result: ReceiptData = {
            receiptNumber,
            dateFormatted: format(new Date(paymentData.payment_date), 'dd MMMM yyyy HH:mm', { locale: tr }),
            organization: {
                name: orgData?.name || 'Kurum Adı',
                logo_url: orgData?.logo_url || null,
                logo_base64: logoBase64,
                address: orgData?.address || null,
                phone: orgData?.phone || null,
            },
            student: {
                fullName: paymentData.student?.full_name || 'Bilinmiyor',
                parentName: paymentData.student?.parent_name || null,
                tcNo: paymentData.student?.tc_no || null,
            },
            payment: {
                id: paymentData.id,
                amount: Number(paymentData.amount),
                amountWords: numberToWordsTR(Number(paymentData.amount)),
                method: methodMap[paymentData.payment_method] || 'Diğer',
                referenceNo: paymentData.reference_no || null,
                notes: paymentData.notes || null,
            },
            details: {
                serviceName,
                academicPeriod,
            },
            financials: {
                totalDebt,
                totalPaid,
                remainingDebt,
            },
            operator: {
                fullName: paymentData.operator?.full_name || 'Bilinmiyor',
            }
        };

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
