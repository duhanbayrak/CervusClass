'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { StudentFee, FeeInstallment } from '@/types/accounting';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Shared helpers ---

type ServiceInput = {
    serviceId: string;
    serviceName?: string;
    unitPrice: number;
    vatRate: number;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
    discountReason?: string;
    downPayment: number;
    downPaymentAccountId?: string;
    installmentCount: number;
    startMonth?: string;
    paymentDueDay: number;
}

function calcNetAmount(unitPrice: number, discountAmount: number, discountType: 'percentage' | 'fixed'): number {
    if (discountType === 'percentage') return unitPrice - (unitPrice * (discountAmount / 100))
    return unitPrice - discountAmount
}

function parseStartMonth(startMonth?: string): { startYear: number; startMonthIndex: number } {
    const now = new Date()
    if (!startMonth) return { startYear: now.getFullYear(), startMonthIndex: now.getMonth() }
    const parts = startMonth.split('-')
    if (parts.length === 2) return { startYear: Number.parseInt(parts[0]), startMonthIndex: Number.parseInt(parts[1]) - 1 }
    return { startYear: now.getFullYear(), startMonthIndex: now.getMonth() }
}

function buildInstallmentRows(
    feeId: string,
    organizationId: string,
    service: ServiceInput,
    totalAmountWithVat: number,
    startInstallmentNumber: number
): object[] {
    const rows: object[] = []
    const remainingAmount = totalAmountWithVat - (service.downPayment || 0)
    if (remainingAmount <= 0 || service.installmentCount <= 0) return rows

    const amountPerInstallment = parseFloat((remainingAmount / service.installmentCount).toFixed(2))
    const { startYear, startMonthIndex } = parseStartMonth(service.startMonth)
    let num = startInstallmentNumber

    for (let i = 0; i < service.installmentCount; i++) {
        let dueMonth = startMonthIndex + i
        let dueYear = startYear
        if (dueMonth > 11) {
            dueYear += Math.floor((startMonthIndex + i) / 12)
            dueMonth = dueMonth % 12
        }
        let instAmount = amountPerInstallment
        if (i === service.installmentCount - 1) {
            instAmount = parseFloat((remainingAmount - amountPerInstallment * (service.installmentCount - 1)).toFixed(2))
        }
        const instDate = new Date(dueYear, dueMonth, service.paymentDueDay)
        rows.push({
            fee_id: feeId,
            organization_id: organizationId,
            installment_number: num++,
            amount: instAmount,
            due_date: format(instDate, 'yyyy-MM-dd'),
            status: 'pending',
            paid_amount: 0,
        })
    }
    return rows
}

async function getOrCreateIncomeCategory(supabase: SupabaseClient, organizationId: string): Promise<string | null> {
    const { data: existing } = await supabase
        .from('finance_categories')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', 'Öğrenci Ücreti')
        .eq('type', 'income')
        .maybeSingle()
    if (existing?.id) return existing.id

    const { data: newCat } = await supabase
        .from('finance_categories')
        .insert({ organization_id: organizationId, name: 'Öğrenci Ücreti', type: 'income', icon: '🎓' })
        .select('id')
        .single()
    return newCat?.id ?? null
}

async function recordDownPaymentTransaction(
    supabase: SupabaseClient,
    organizationId: string,
    userId: string,
    service: ServiceInput,
    installmentId: string,
    studentId: string,
    feeId: string
): Promise<void> {
    await supabase.from('fee_payments').insert({
        organization_id: organizationId,
        installment_id: installmentId,
        amount: service.downPayment,
        account_id: service.downPaymentAccountId,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
        reference_no: 'PESINAT-' + feeId.substring(0, 6).toUpperCase(),
        student_id: studentId,
        created_by: userId,
    })

    const catId = await getOrCreateIncomeCategory(supabase, organizationId)
    if (!catId) return

    let sub = service.downPayment
    let vat = 0
    if (service.vatRate > 0) {
        sub = Number((service.downPayment / (1 + service.vatRate / 100)).toFixed(2))
        vat = Number((service.downPayment - sub).toFixed(2))
    }

    await supabase.from('finance_transactions').insert({
        organization_id: organizationId,
        account_id: service.downPaymentAccountId,
        category_id: catId,
        service_id: service.serviceId,
        subtotal: sub,
        vat_rate: service.vatRate,
        vat_amount: vat,
        type: 'income',
        amount: service.downPayment,
        description: `Öğrenci Taksit Peşinatı (${service.serviceName || 'Hizmet'})`,
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        created_by: userId,
    })
}

/**
 * Öğrenci ücretlerini getirir (filtreli).
 */
export async function getStudentFees(filters?: {
    student_id?: string;
    class_id?: string;
    academic_period?: string;
    status?: 'active' | 'completed' | 'cancelled';
}): Promise<StudentFee[]> {
    const { supabase, error } = await getAuthContext();
    if (error) return [];

    let query = supabase
        .from('student_fees')
        .select(`
            *,
            student:profiles!student_id(full_name, email, classes:classes(name)),
            classes:classes!class_id(name),
            service:finance_services!service_id(name)
        `)
        .order('created_at', { ascending: false });

    if (filters?.student_id) query = query.eq('student_id', filters.student_id);
    if (filters?.class_id) query = query.eq('class_id', filters.class_id);
    if (filters?.academic_period) query = query.eq('academic_period', filters.academic_period);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error: fetchError } = await query;
    if (fetchError) return [];
    return (data || []) as StudentFee[];
}

/**
 * Belirli bir öğrenci, akademik dönem ve servis listesi için mükerrer kayıt kontrolü yapar.
 * İşlem sonucunda sistemde daha önceden var olan (active, completed) hizmetlerin isimlerini döner.
 */
export async function checkDuplicateServices(data: {
    studentId: string;
    academicPeriod: string;
    serviceIds: string[];
}): Promise<{ duplicates: string[]; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { duplicates: [], error: error || 'Yetkilendirme hatası' };
    if (!data.serviceIds || data.serviceIds.length === 0) return { duplicates: [] };

    const { data: existingFees, error: fetchError } = await supabase
        .from('student_fees')
        .select(`
            service_id,
            service:finance_services(name)
        `)
        .eq('organization_id', organizationId)
        .eq('student_id', data.studentId)
        .eq('academic_period', data.academicPeriod)
        .in('status', ['active', 'completed'])
        .in('service_id', data.serviceIds);

    if (fetchError) {
        return { duplicates: [], error: 'Mükerrer kontrolü sırasında bir hata oluştu.' };
    }

    if (!existingFees || existingFees.length === 0) {
        return { duplicates: [] };
    }

    // Sadece benzersiz isimleri döndür
    const duplicateNames = Array.from(new Set(existingFees.map((fee: any) => fee.service?.name || 'İsimsiz Hizmet')));
    return { duplicates: duplicateNames };
}

/**
 * Tek bir öğrencinin ücret detayını taksitleriyle birlikte getirir.
 */
export async function getStudentFeeDetail(feeId: string): Promise<{
    fee: StudentFee | null;
    installments: FeeInstallment[];
}> {
    const { supabase, error } = await getAuthContext();
    if (error) return { fee: null, installments: [] };

    const [feeResult, installmentsResult] = await Promise.all([
        supabase
            .from('student_fees')
            .select(`
                *,
                student:profiles!student_id(full_name, email, classes:classes(name)),
                classes:classes!class_id(name),
                service:finance_services!service_id(name)
            `)
            .eq('id', feeId)
            .single(),
        supabase
            .from('fee_installments')
            .select('*')
            .eq('fee_id', feeId)
            .order('installment_number', { ascending: true }),
    ]);

    return {
        fee: (feeResult.data || null) as StudentFee | null,
        installments: (installmentsResult.data || []) as FeeInstallment[],
    };
}

/**
 * Yeni öğrenci ücreti ve taksitleri oluşturur.
 */
export async function createStudentFee(feeData: {
    student_id: string;
    class_id?: string;
    total_amount: number;
    discount_amount?: number;
    discount_type?: 'percentage' | 'fixed';
    discount_reason?: string;
    installment_count: number;
    academic_period: string;
    notes?: string;
    payment_due_day?: number;
}): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || 'Yetkilendirme hatası' };

    // Net tutarı hesapla
    let netAmount = feeData.total_amount;
    if (feeData.discount_amount && feeData.discount_amount > 0) {
        if (feeData.discount_type === 'percentage') {
            netAmount = feeData.total_amount * (1 - feeData.discount_amount / 100);
        } else {
            netAmount = feeData.total_amount - feeData.discount_amount;
        }
    }

    // 1. Ücret kaydı oluştur
    const { data: fee, error: insertError } = await supabase
        .from('student_fees')
        .insert({
            organization_id: organizationId,
            student_id: feeData.student_id,
            class_id: feeData.class_id || null,
            total_amount: feeData.total_amount,
            discount_amount: feeData.discount_amount || 0,
            discount_type: feeData.discount_type || null,
            discount_reason: feeData.discount_reason || null,
            net_amount: netAmount,
            installment_count: feeData.installment_count,
            academic_period: feeData.academic_period,
            notes: feeData.notes || null,
        })
        .select()
        .single();

    if (insertError) return { success: false, error: insertError.message };

    // 2. Taksitleri oluştur
    const installmentAmount = Math.round((netAmount / feeData.installment_count) * 100) / 100;
    const dueDay = feeData.payment_due_day || 1;
    const today = new Date();

    const installments = Array.from({ length: feeData.installment_count }, (_, i) => {
        // Her taksit bir sonraki ayın vade gününde
        const dueDate = new Date(today.getFullYear(), today.getMonth() + i, dueDay);
        // Son taksite yuvarlama farkını ekle
        const amount = i === feeData.installment_count - 1
            ? netAmount - (installmentAmount * (feeData.installment_count - 1))
            : installmentAmount;

        return {
            fee_id: fee.id,
            organization_id: organizationId,
            installment_number: i + 1,
            amount,
            due_date: format(dueDate, 'yyyy-MM-dd'),
            status: 'pending' as const,
            paid_amount: 0,
        };
    });

    const { error: installmentError } = await supabase
        .from('fee_installments')
        .insert(installments);

    if (installmentError) return { success: false, error: installmentError.message };

    return { success: true };
}

/**
 * Toplu ücret atama — sınıftaki tüm öğrencilere aynı ücreti atar.
 */
export async function bulkAssignFees(data: {
    class_id: string;
    total_amount: number;
    installment_count: number;
    academic_period: string;
    payment_due_day?: number;
}): Promise<{ success: boolean; assigned_count: number; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, assigned_count: 0, error: error || 'Yetkilendirme hatası' };

    // Sınıftaki öğrenci role_id'sini bul
    const { data: studentRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single();

    if (!studentRole) return { success: false, assigned_count: 0, error: 'Öğrenci rolü bulunamadı' };

    // Sınıftaki öğrencileri getir
    const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('class_id', data.class_id)
        .eq('role_id', studentRole.id)
        .is('deleted_at', null);

    if (!students || students.length === 0) {
        return { success: false, assigned_count: 0, error: 'Sınıfta öğrenci bulunamadı' };
    }

    // Her öğrenci için ücret oluştur
    let assignedCount = 0;
    for (const student of students) {
        const result = await createStudentFee({
            student_id: student.id,
            class_id: data.class_id,
            total_amount: data.total_amount,
            installment_count: data.installment_count,
            academic_period: data.academic_period,
            payment_due_day: data.payment_due_day,
        });
        if (result.success) assignedCount++;
    }

    return { success: true, assigned_count: assignedCount };
}
/**
 * Öğrenci ücretini iptal eder.
 * - Bekleyen taksitleri iptal eder
 * - Opsiyonel: Ödenen tutarı kasa/banka hesabından düşer ve muhasebe iade kaydı oluşturur
 */
export async function cancelStudentFee(
    feeId: string,
    options?: {
        refund?: boolean;
        refundAccountId?: string;
        reason?: string;
    }
): Promise<{ success: boolean; error?: string; refundedAmount?: number }> {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || 'Yetkilendirme hatası' };

    // 1. Fee kaydını kontrol et
    const { data: fee } = await supabase
        .from('student_fees')
        .select('id, status, student_id')
        .eq('id', feeId)
        .single();

    if (!fee) return { success: false, error: 'Ücret kaydı bulunamadı.' };
    if (fee.status === 'cancelled') return { success: false, error: 'Bu ücret zaten iptal edilmiş.' };

    // 2. Tüm taksitleri çek
    const { data: installments } = await supabase
        .from('fee_installments')
        .select('id, status')
        .eq('fee_id', feeId);

    // 3. Bekleyen taksitleri "cancelled" yap
    if (installments && installments.length > 0) {
        const pendingIds = installments
            .filter(i => i.status !== 'paid')
            .map(i => i.id);

        if (pendingIds.length > 0) {
            const { error: cancelError } = await supabase
                .from('fee_installments')
                .update({ status: 'cancelled' })
                .in('id', pendingIds);

            if (cancelError) {
                return { success: false, error: 'Taksitler iptal edilemedi: ' + cancelError.message };
            }
        }
    }

    // 4. İade işlemi (opsiyonel)
    const refundedAmount = options?.refund
        ? await processRefund(supabase, organizationId, user.id, fee.student_id, installments || [], options)
        : 0;

    // 5. Fee durumunu "cancelled" yap
    const { error: updateError } = await supabase
        .from('student_fees')
        .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
            notes: options?.reason || undefined,
        })
        .eq('id', feeId);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true, refundedAmount };
}

type SupabaseClient = Awaited<ReturnType<typeof getAuthContext>>['supabase'];

async function processRefund(
    supabase: SupabaseClient,
    organizationId: string,
    userId: string,
    studentId: string,
    installments: Array<{ id: string; status: string }>,
    options: { refundAccountId?: string; reason?: string }
): Promise<number> {
    const installmentIds = installments.map(i => i.id);
    if (installmentIds.length === 0) return 0;

    const { data: payments } = await supabase
        .from('fee_payments')
        .select('id, amount, account_id')
        .in('installment_id', installmentIds);

    if (!payments || payments.length === 0) return 0;

    const refundedAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (refundedAmount <= 0) return 0;

    const refundAccountId = options.refundAccountId || payments[0].account_id;
    const { data: student } = await supabase.from('profiles').select('full_name').eq('id', studentId).single();
    const studentName = student?.full_name || 'Öğrenci';
    const reasonText = options.reason ? ` (${options.reason})` : '';

    const { data: category } = await supabase
        .from('finance_categories')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', 'Öğrenci Ücreti')
        .eq('type', 'income')
        .maybeSingle();

    if (category) {
        await supabase.from('finance_transactions').insert({
            organization_id: organizationId,
            account_id: refundAccountId,
            category_id: category.id,
            type: 'expense',
            amount: refundedAmount,
            description: `${studentName} - Ücret iptali iadesi${reasonText}`,
            transaction_date: new Date().toISOString(),
            created_by: userId,
        });
    }
    return refundedAmount;
}

/**
 * Öğrenciye birden fazla hizmeti (sepeti) aynı anda atar. Kayıt modülünden esinlenilmiştir.
 */
export async function assignMultipleServicesToStudent(data: {
    studentId: string;
    classId?: string;
    academicPeriod: string;
    services: Array<{
        serviceId: string;
        serviceName?: string;
        unitPrice: number;
        vatRate: number;
        discountAmount: number;
        discountType: 'percentage' | 'fixed';
        discountReason?: string;
        downPayment: number;
        downPaymentAccountId?: string;
        installmentCount: number;
        startMonth?: string;
        paymentDueDay: number;
    }>;
}): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || 'Yetkilendirme hatası' };

    try {
        for (const service of data.services) {
            await assignServiceToStudent(supabase, organizationId, user.id, data.studentId, data.classId || null, service as Record<string, unknown>, data.academicPeriod)
        }
        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Beklenmedik hata' }
    }
}

async function assignServiceToStudent(
    supabase: SupabaseClient,
    organizationId: string,
    userId: string,
    studentId: string,
    classId: string | null,
    service: Record<string, unknown>,
    academicPeriod = '2024-2025'
): Promise<void> {
    const netAmount = calcNetAmount(service.unitPrice as number, (service.discountAmount as number) || 0, (service.discountType as string) || 'fixed')
    const vatAmount = netAmount * ((service.vatRate as number) / 100)
    const totalAmountWithVat = netAmount + vatAmount
    const hasDownPayment = (service.downPayment as number) > 0
    const mainInstallmentCount = (service.installmentCount as number) > 0 ? (service.installmentCount as number) : 1

    const { data: feeData, error: feeError } = await supabase
        .from('student_fees')
        .insert({
            organization_id: organizationId,
            student_id: studentId,
            class_id: classId,
            service_id: service.serviceId,
            total_amount: service.unitPrice,
            discount_amount: (service.discountAmount as number) || 0,
            discount_type: service.discountType || null,
            discount_reason: service.discountReason || null,
            vat_rate: service.vatRate,
            vat_amount: vatAmount,
            net_amount: totalAmountWithVat,
            installment_count: hasDownPayment ? mainInstallmentCount + 1 : mainInstallmentCount,
            academic_period: academicPeriod,
            status: 'active',
        })
        .select()
        .single()

    if (feeError) throw new Error(`${(service.serviceName as string) || 'Hizmet'} planı oluşturulamadı: ${feeError.message}`)
    const feeId = feeData.id

    const installmentsToInsert: object[] = []
    let nextNum = 1

    if (hasDownPayment) {
        if (!service.downPaymentAccountId) throw new Error(`${(service.serviceName as string) || 'Hizmet'} peşinatı için kasa/banka hesabı seçilmedi.`)
        installmentsToInsert.push({
            fee_id: feeId, organization_id: organizationId,
            installment_number: nextNum++, amount: service.downPayment,
            due_date: format(new Date(), 'yyyy-MM-dd'), status: 'paid',
            paid_amount: service.downPayment, paid_at: new Date().toISOString(),
        })
    }

    installmentsToInsert.push(...buildInstallmentRows(feeId, organizationId, service as Parameters<typeof buildInstallmentRows>[3], totalAmountWithVat, nextNum))

    if (installmentsToInsert.length > 0) {
        const { data: insertedInstallments, error: installmentError } = await supabase
            .from('fee_installments').insert(installmentsToInsert).select()
        if (installmentError) throw new Error(`${(service.serviceName as string) || 'Hizmet'} taksit planı kaydedilemedi: ${installmentError.message}`)

        if (hasDownPayment && insertedInstallments) {
            const dpInst = insertedInstallments.find(i => i.installment_number === 1)
            if (dpInst) {
                await recordDownPaymentTransaction(supabase, organizationId, userId, service as Parameters<typeof recordDownPaymentTransaction>[4], dpInst.id, studentId, feeId)
            }
        }
    }
}

/**
 * Toplu öğrencilere (ID dizisi) çoklu hizmet veya paket atamak için kullanılır.
 * Öğrencinin 'class_id'sini profiles üzerinden çeker ve Kayıt esnasındaki
 * KDV/Peşinat/Taksit bölme işlemlerinin birebir aynısını entegre eder.
 */
export async function assignBulkServicesToStudents(
    studentIds: string[],
    services: Record<string, unknown>[]
): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || 'Yetkilendirme hatası' };

    try {
        for (const studentId of studentIds) {
            const { data: profile } = await supabase.from('profiles').select('class_id').eq('id', studentId).single()
            const classId = profile?.class_id || null
            for (const service of services) {
                await assignServiceToStudent(supabase, organizationId, user.id, studentId, classId, service)
            }
        }
        return { success: true }
    } catch (err: unknown) {
        logger.error('Toplu hizmet ataması başarısız', { action: 'assignBulkServicesToStudents' }, err)
        return { success: false, error: err instanceof Error ? err.message : 'Beklenmedik hata' }
    }
}
