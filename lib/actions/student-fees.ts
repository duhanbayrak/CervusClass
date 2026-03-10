'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { StudentFee, FeeInstallment } from '@/types/accounting';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getOrCreateStudentFeeCategory, calcInstallmentAmounts } from '@/lib/actions/utils/finance-helpers';

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

    const amounts = calcInstallmentAmounts(remainingAmount, service.installmentCount);
    const { startYear, startMonthIndex } = parseStartMonth(service.startMonth)
    let num = startInstallmentNumber

    for (let i = 0; i < service.installmentCount; i++) {
        let dueMonth = startMonthIndex + i
        let dueYear = startYear
        if (dueMonth > 11) {
            dueYear += Math.floor((startMonthIndex + i) / 12)
            dueMonth = dueMonth % 12
        }
        const instAmount = amounts[i];
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



async function recordDownPaymentTransaction(
    supabase: SupabaseClient,
    organizationId: string,
    userId: string,
    service: ServiceInput,
    installmentId: string,
    studentId: string,
    feeId: string
): Promise<void> {
    // Peşinat ödeme kaydı — hata kritik, throw et (üst caller rollback yapar)
    const { error: paymentError } = await supabase.from('fee_payments').insert({
        organization_id: organizationId,
        installment_id: installmentId,
        amount: service.downPayment,
        account_id: service.downPaymentAccountId,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
        reference_no: 'PESINAT-' + feeId.substring(0, 6).toUpperCase(),
        student_id: studentId,
        created_by: userId,
    });
    if (paymentError) {
        throw new Error(`Peşinat ödeme kaydı oluşturulamadı: ${paymentError.message}`);
    }

    const catId = await getOrCreateStudentFeeCategory(supabase, organizationId);
    if (!catId) {
        throw new Error('Peşinat muhasebe kategorisi oluşturulamadı.');
    }

    let sub = service.downPayment;
    let vat = 0;
    if (service.vatRate > 0) {
        sub = Number((service.downPayment / (1 + service.vatRate / 100)).toFixed(2));
        vat = Number((service.downPayment - sub).toFixed(2));
    }

    // Muhasebe gelir kaydı — hata kritik, throw et
    const { error: txError } = await supabase.from('finance_transactions').insert({
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
    });
    if (txError) {
        throw new Error(`Peşinat muhasebe kaydı oluşturulamadı: ${txError.message}`);
    }
}

/**
 * Öğrenci ücretlerini sayfalama destekli getirir.
 */
export async function getStudentFees(filters?: {
    student_id?: string;
    class_id?: string;
    academic_period?: string;
    status?: 'active' | 'completed' | 'cancelled';
    limit?: number;
    offset?: number;
}): Promise<{ data: StudentFee[]; count: number }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { data: [], count: 0 };

    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;

    let query = supabase
        .from('student_fees')
        .select(`
            *,
            student:profiles!student_id(full_name, email, classes:classes(name)),
            classes:classes!class_id(name),
            service:finance_services!service_id(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1); // Sayfalama

    if (filters?.student_id) query = query.eq('student_id', filters.student_id);
    if (filters?.class_id) query = query.eq('class_id', filters.class_id);
    if (filters?.academic_period) query = query.eq('academic_period', filters.academic_period);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, count, error: fetchError } = await query;
    if (fetchError) return { data: [], count: 0 };
    return { data: (data || []) as StudentFee[], count: count || 0 };
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
    const duplicateNames = Array.from(new Set(existingFees.map((fee: { service?: { name?: string } | null }) => fee.service?.name || 'İsimsiz Hizmet')));
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
    vat_rate?: number; // YENİ: KDV Oranı
    installment_count: number;
    academic_period: string;
    notes?: string;
    payment_due_day?: number;
}): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || 'Yetkilendirme hatası' };

    // Net tutarı hesapla (Önce indirim düşülür)
    let discountedAmount = feeData.total_amount;
    if (feeData.discount_amount && feeData.discount_amount > 0) {
        if (feeData.discount_type === 'percentage') {
            discountedAmount = feeData.total_amount * (1 - feeData.discount_amount / 100);
        } else {
            discountedAmount = feeData.total_amount - feeData.discount_amount;
        }
    }

    // KDV hesaplaması
    const vatRate = feeData.vat_rate || 0;
    const vatAmount = discountedAmount * (vatRate / 100);
    const totalAmountWithVat = discountedAmount + vatAmount;

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
            vat_rate: vatRate,
            vat_amount: vatAmount,
            net_amount: discountedAmount, // KDV Hariç İndirimli Tutar
            installment_count: feeData.installment_count,
            academic_period: feeData.academic_period,
            notes: feeData.notes || null,
        })
        .select()
        .single();

    if (insertError) return { success: false, error: insertError.message };

    // 2. Taksitleri oluştur
    const amounts = calcInstallmentAmounts(totalAmountWithVat, feeData.installment_count);
    const dueDay = feeData.payment_due_day || 1;
    const today = new Date();

    const installments = Array.from({ length: feeData.installment_count }, (_, i) => {
        // Her taksit bir sonraki ayın vade gününde
        const dueDate = new Date(today.getFullYear(), today.getMonth() + i, dueDay);
        const amount = amounts[i];

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
 *
 * Başarısız olan öğrenciler `failed_students` listesinde döndürülür.
 * Tüm öğrenciler başarılıysa `success: true`, en az biri başarısızsa `success: false`.
 */
export async function bulkAssignFees(data: {
    class_id: string;
    total_amount: number;
    installment_count: number;
    academic_period: string;
    payment_due_day?: number;
}): Promise<{
    success: boolean;
    assigned_count: number;
    failed_students: Array<{ student_id: string; error: string }>;
    error?: string;
}> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) {
        return { success: false, assigned_count: 0, failed_students: [], error: error || 'Yetkilendirme hatası' };
    }

    // Sınıftaki öğrenci role_id'sini bul
    const { data: studentRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single();

    if (!studentRole) {
        return { success: false, assigned_count: 0, failed_students: [], error: 'Öğrenci rolü bulunamadı' };
    }

    // Sınıftaki öğrencileri getir
    const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('class_id', data.class_id)
        .eq('role_id', studentRole.id)
        .is('deleted_at', null);

    if (!students || students.length === 0) {
        return { success: false, assigned_count: 0, failed_students: [], error: 'Sınıfta öğrenci bulunamadı' };
    }

    // Her öğrenci için ücret oluştur; başarısız olanları kayıt altına al
    let assignedCount = 0;
    const failedStudents: Array<{ student_id: string; error: string }> = [];

    for (const student of students) {
        const result = await createStudentFee({
            student_id: student.id,
            class_id: data.class_id,
            total_amount: data.total_amount,
            installment_count: data.installment_count,
            academic_period: data.academic_period,
            payment_due_day: data.payment_due_day,
        });

        if (result.success) {
            assignedCount++;
        } else {
            failedStudents.push({
                student_id: student.id,
                error: result.error || 'Bilinmeyen hata',
            });
        }
    }

    // Kısmi başarı: bazıları başarılı, bazıları değil
    const allSucceeded = failedStudents.length === 0;
    return {
        success: allSucceeded,
        assigned_count: assignedCount,
        failed_students: failedStudents,
        ...(failedStudents.length > 0 && {
            error: `${failedStudents.length} öğrenciye ücret atanamadı. Lütfen detayları kontrol edin.`,
        }),
    };
}
/**
 * Öğrenci ücretini iptal eder.
 *
 * Tüm adımlar (bekleyen taksitleri iptal + opsiyonel iade muhasebesi +
 * student_fees.status güncellemesi) tek bir PostgreSQL transaction içinde
 * atomik olarak çalışır. Herhangi bir adımda hata oluşursa tüm işlem geri alınır.
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

    // İade yapılacaksa muhasebe kategorisini hazırla
    let categoryId: string | null = null;
    if (options?.refund && options?.refundAccountId) {
        categoryId = await getOrCreateStudentFeeCategory(supabase, organizationId);
        if (!categoryId) {
            return { success: false, error: 'İade için muhasebe kategorisi oluşturulamadı.' };
        }
    }

    // İade için öğrenci adını al (RPC description için)
    let studentName = 'Öğrenci';
    if (options?.refund) {
        const { data: feeData } = await supabase
            .from('student_fees')
            .select('student:profiles!student_id(full_name)')
            .eq('id', feeId)
            .single() as { data: { student?: { full_name?: string } } | null };
        studentName = feeData?.student?.full_name || 'Öğrenci';
    }

    // Atomik RPC çağrısı — tüm iptal adımları tek transaction'da.
    // NOT: cancel_student_fee_atomic yeni eklenmiş bir fonksiyon olduğundan
    // Supabase'in otomatik tip dosyasına henüz yansımamıştır.
    const { data: rpcResult, error: rpcError } = await (
        supabase.rpc as unknown as (
            fn: string,
            args: Record<string, unknown>
        ) => Promise<{ data: unknown; error: { message: string } | null }>
    )('cancel_student_fee_atomic', {
        p_fee_id: feeId,
        p_organization_id: organizationId,
        p_cancelled_by: user.id,
        p_reason: options?.reason || null,
        p_refund: options?.refund || false,
        p_refund_account_id: options?.refundAccountId || null,
        p_category_id: categoryId,
        p_student_name: studentName,
    });

    if (rpcError) return { success: false, error: rpcError.message };
    if (!rpcResult) return { success: false, error: 'RPC boş sonuç döndürdü.' };

    const result = rpcResult as { success: boolean; refunded_amount?: number; error?: string };
    if (!result.success) return { success: false, error: result.error || 'Ücret iptal edilemedi.' };

    return { success: true, refundedAmount: result.refunded_amount ?? 0 };
}

// processRefund kaldırıldı — mantığı cancel_student_fee_atomic RPC'sine taşındı (T1).

/**
 * Öğrenciye birden fazla hizmeti (sepeti) aynı anda atar.
 *
 * T2: Application Level Rollback (Node.js catch içinde silme işlemi) mantığı
 * PostgreSQL RPC seviyesine (assign_multiple_services_atomic) taşınmıştır.
 * Tüm işlemler tek bir veritabanı transactionu içerisinde gerçekleşir.
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
        // downPaymentAccountId boş string olarak gelirse PostgreSQL UUID cast'i başarısız olur.
        // Gönderilmeden önce boş string değerleri undefined'a normalize et.
        const sanitizedServices = data.services.map(s => ({
            ...s,
            downPaymentAccountId: s.downPaymentAccountId || undefined,
            discountReason: s.discountReason || undefined,
            startMonth: s.startMonth || undefined,
        }));

        const { data: rpcResult, error: rpcError } = await (
            supabase.rpc as unknown as (
                fn: string,
                args: Record<string, unknown>
            ) => Promise<{ data: unknown; error: { message: string } | null }>
        )('assign_multiple_services_atomic', {
            p_organization_id: organizationId,
            p_student_id: data.studentId,
            p_class_id: data.classId || null,
            p_academic_period: data.academicPeriod,
            p_created_by: user.id,
            p_services: sanitizedServices,
        });

        if (rpcError) {
            logger.error('Multiple services assignment rpc error', { error: rpcError });
            return { success: false, error: rpcError.message };
        }

        const result = rpcResult as { success: boolean; error?: string };
        if (!result.success) {
            logger.error('assignMultipleServicesToStudent: RPC returned failure', {
                action: 'assignMultipleServicesToStudent',
                rpcError: result.error,
                studentId: data.studentId,
                academicPeriod: data.academicPeriod,
                serviceCount: data.services.length,
            });
            return { success: false, error: result.error || 'Atama işlemi tamamlanamadı (RPC level).' };
        }

        return { success: true };
    } catch (err: unknown) {
        logger.error('assignMultipleServicesToStudent: Exception', { action: 'assignMultipleServicesToStudent' }, err);
        return { success: false, error: err instanceof Error ? err.message : 'Beklenmedik hata' };
    }
}

/**
 * Tek bir hizmeti öğrenciye atar: fee + taksit planı + (opsiyonel) peşinat kaydı.
 *
 * @returns Oluşturulan `student_fees.id` (rollback için üst fonksiyona iletilir)
 */
async function assignServiceToStudent(
    supabase: SupabaseClient,
    organizationId: string,
    userId: string,
    studentId: string,
    classId: string | null,
    service: Record<string, unknown>,
    academicPeriod = '2024-2025'
): Promise<string> {
    const netAmount = calcNetAmount(service.unitPrice as number, (service.discountAmount as number) || 0, ((service.discountType as string) || 'fixed') as 'fixed' | 'percentage')
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
            // net_amount = indirim sonrası KDV HARİÇ tutar
            // (KDV dahil brüt = net_amount + vat_amount)
            net_amount: netAmount,
            // installment_count = sözleşmedeki taksit adedi (peşinat satırı dahil değil)
            installment_count: mainInstallmentCount,
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

    installmentsToInsert.push(...buildInstallmentRows(feeId, organizationId, service as ServiceInput, totalAmountWithVat, nextNum))

    if (installmentsToInsert.length > 0) {
        const { data: insertedInstallments, error: installmentError } = await supabase
            .from('fee_installments').insert(installmentsToInsert).select()
        if (installmentError) throw new Error(`${(service.serviceName as string) || 'Hizmet'} taksit planı kaydedilemedi: ${installmentError.message}`)

        if (hasDownPayment && insertedInstallments) {
            const dpInst = insertedInstallments.find(i => i.installment_number === 1)
            if (dpInst) {
                await recordDownPaymentTransaction(supabase, organizationId, userId, service as ServiceInput, dpInst.id, studentId, feeId)
            }
        }
    }

    // Oluşturulan fee ID'sini üst fonksiyona döndür (rollback desteği için)
    return feeId;
}

/**
 * Toplu öğrencilere (ID dizisi) çoklu hizmet veya paket atamak için kullanılır.
 *
 * T9 Optimizasyonu: Döngü içindeki N adet profil sorgusu tek bir SELECT'e çökertildi.
 */
export async function assignBulkServicesToStudents(
    studentIds: string[],
    services: Record<string, unknown>[]
): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || 'Yetkilendirme hatası' };

    // T9: Tüm profilleri tek sorguda çek (N+1 yerine 1 sorgu)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, class_id')
        .in('id', studentIds);

    // class_id eşleştirme tablosu oluştur
    const classIdByStudentId = new Map(
        (profiles || []).map(p => [p.id, p.class_id ?? null])
    );

    // Rollback için oluşturulan fee ID'lerini izle
    const createdFeeIds: string[] = [];

    try {
        for (const studentId of studentIds) {
            const classId = classIdByStudentId.get(studentId) ?? null;
            for (const service of services) {
                const feeId = await assignServiceToStudent(supabase, organizationId, user.id, studentId, classId, service);
                createdFeeIds.push(feeId);
            }
        }
        return { success: true };
    } catch (err: unknown) {
        // Rollback: başarıyla oluşturulan tüm fee kayıtlarını sil.
        // fee_installments ON DELETE CASCADE ile otomatik silinir.
        if (createdFeeIds.length > 0) {
            const { error: rollbackError } = await supabase
                .from('student_fees')
                .delete()
                .in('id', createdFeeIds);

            if (rollbackError) {
                logger.error(
                    'assignBulkServicesToStudents: rollback başarısız',
                    { action: 'assignBulkServicesToStudents', createdFeeIds },
                    rollbackError
                );
            }
        }
        logger.error('Toplu hizmet ataması başarısız', { action: 'assignBulkServicesToStudents' }, err);
        return { success: false, error: err instanceof Error ? err.message : 'Beklenmedik hata' };
    }
}
