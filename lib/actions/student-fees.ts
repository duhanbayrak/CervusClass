'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { StudentFee, FeeInstallment, FinancialServiceItem } from '@/types/accounting';
import { format } from 'date-fns';

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
                console.error("Installment cancel error:", cancelError);
                return { success: false, error: 'Taksitler iptal edilemedi: ' + cancelError.message };
            }
        }
    }

    // 4. İade işlemi (opsiyonel)
    let refundedAmount = 0;

    if (options?.refund) {
        // Bu fee'ye ait tüm ödemeleri çek
        const installmentIds = (installments || []).map(i => i.id);

        if (installmentIds.length > 0) {
            const { data: payments } = await supabase
                .from('fee_payments')
                .select('id, amount, account_id')
                .in('installment_id', installmentIds);

            if (payments && payments.length > 0) {
                // Toplam ödenen tutarı hesapla
                refundedAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

                if (refundedAmount > 0) {
                    // İade yapılacak hesap: parametre verilmişse o, yoksa ilk ödemenin hesabı
                    const refundAccountId = options.refundAccountId || payments[0].account_id;

                    // a) Kasa/banka bakiyesinden düş
                    const { data: account } = await supabase
                        .from('finance_accounts')
                        .select('balance')
                        .eq('id', refundAccountId)
                        .single();

                    if (account) {
                        await supabase
                            .from('finance_accounts')
                            .update({ balance: Number(account.balance) - refundedAmount })
                            .eq('id', refundAccountId);
                    }

                    // b) Öğrenci adını çek
                    const { data: student } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', fee.student_id)
                        .single();

                    const studentName = student?.full_name || 'Öğrenci';
                    const reasonText = options.reason ? ` (${options.reason})` : '';

                    // c) "Öğrenci Ücreti" kategorisini bul
                    const { data: category } = await supabase
                        .from('finance_categories')
                        .select('id')
                        .eq('organization_id', organizationId)
                        .eq('name', 'Öğrenci Ücreti')
                        .eq('type', 'income')
                        .maybeSingle();

                    // d) Muhasebe iade kaydı oluştur (gider olarak)
                    if (category) {
                        await supabase
                            .from('finance_transactions')
                            .insert({
                                organization_id: organizationId,
                                account_id: refundAccountId,
                                category_id: category.id,
                                type: 'expense',
                                amount: refundedAmount,
                                description: `${studentName} - Ücret iptali iadesi${reasonText}`,
                                transaction_date: new Date().toISOString(),
                                created_by: user.id,
                            });
                    }
                }
            }
        }
    }

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

    for (const service of data.services) {
        const netAmount = service.discountType === 'percentage'
            ? service.unitPrice - (service.unitPrice * (service.discountAmount / 100))
            : service.unitPrice - service.discountAmount;

        const vatAmount = netAmount * (service.vatRate / 100);
        const totalAmountWithVat = netAmount + vatAmount;

        const hasDownPayment = service.downPayment > 0;
        const mainInstallmentCount = service.installmentCount > 0 ? service.installmentCount : 1;

        // 1. Fee kaydını oluştur
        const { data: feeData, error: feeError } = await supabase
            .from('student_fees')
            .insert({
                organization_id: organizationId,
                student_id: data.studentId,
                class_id: data.classId || null,
                service_id: service.serviceId,
                total_amount: service.unitPrice,
                discount_amount: service.discountAmount,
                discount_type: service.discountType,
                discount_reason: service.discountReason || null,
                vat_rate: service.vatRate,
                vat_amount: vatAmount,
                net_amount: totalAmountWithVat,
                installment_count: hasDownPayment ? mainInstallmentCount + 1 : mainInstallmentCount,
                academic_period: data.academicPeriod,
                status: 'active'
            })
            .select()
            .single();

        if (feeError) return { success: false, error: `Hizmet eklendiğinde hata oluştu: ${feeError.message}` };
        const feeId = feeData.id;

        // 2. Taksit & Peşinat Planı
        const installmentsToInsert = [];
        let currentInstallmentNumber = 1;
        const remainingAmount = totalAmountWithVat - service.downPayment;

        // A. Peşinat varsa (Ödendi olarak kaydedilir)
        if (hasDownPayment && service.downPaymentAccountId) {
            installmentsToInsert.push({
                fee_id: feeId,
                organization_id: organizationId,
                installment_number: currentInstallmentNumber,
                amount: service.downPayment,
                due_date: format(new Date(), 'yyyy-MM-dd'),
                status: 'paid',
                paid_amount: service.downPayment,
                paid_at: new Date().toISOString()
            });
            currentInstallmentNumber++;
        }

        // B. Taksitler
        if (remainingAmount > 0 && service.installmentCount > 0) {
            const amountPerInstallment = parseFloat((remainingAmount / service.installmentCount).toFixed(2));
            let startYear = new Date().getFullYear();
            let startMonthIndex = new Date().getMonth();

            if (service.startMonth) {
                const parts = service.startMonth.split('-');
                if (parts.length === 2) {
                    startYear = parseInt(parts[0]);
                    startMonthIndex = parseInt(parts[1]) - 1;
                }
            }

            for (let i = 0; i < service.installmentCount; i++) {
                let dueMonth = startMonthIndex + i;
                let dueYear = startYear;
                if (dueMonth > 11) {
                    dueMonth = dueMonth % 12;
                    dueYear += Math.floor((startMonthIndex + i) / 12);
                }

                // Son taksit küsurat düzeltmesi
                let instAmount = amountPerInstallment;
                if (i === service.installmentCount - 1) {
                    instAmount = remainingAmount - (amountPerInstallment * (service.installmentCount - 1));
                    instAmount = parseFloat(instAmount.toFixed(2));
                }

                // Js Date objeleri ay 0-11 arası alır.
                const instDate = new Date(dueYear, dueMonth, service.paymentDueDay);

                installmentsToInsert.push({
                    fee_id: feeId,
                    organization_id: organizationId,
                    installment_number: currentInstallmentNumber,
                    amount: instAmount,
                    due_date: format(instDate, 'yyyy-MM-dd'),
                    status: 'pending',
                    paid_amount: 0
                });
                currentInstallmentNumber++;
            }
        }

        if (installmentsToInsert.length > 0) {
            const { error: instError } = await supabase.from('fee_installments').insert(installmentsToInsert);
            if (instError) return { success: false, error: `Taksitler oluşturulurken hata: ${instError.message}` };
        }

        // Peşinat kasaya işleniyor
        if (hasDownPayment && service.downPaymentAccountId) {
            const { data: instCheck } = await supabase.from('fee_installments').select('id').eq('fee_id', feeId).eq('installment_number', 1).single();
            if (instCheck) {
                await supabase.from('fee_payments').insert({
                    organization_id: organizationId,
                    installment_id: instCheck.id,
                    amount: service.downPayment,
                    account_id: service.downPaymentAccountId,
                    payment_date: format(new Date(), 'yyyy-MM-dd'),
                    payment_method: 'cash',
                    reference_no: 'PESINAT-' + feeId.substring(0, 6).toUpperCase(),
                    student_id: data.studentId,
                    created_by: user.id
                });

                // Kasa bakiyesi arttırma
                const { data: acc } = await supabase.from('finance_accounts').select('balance').eq('id', service.downPaymentAccountId).single();
                if (acc) {
                    await supabase.from('finance_accounts').update({ balance: Number(acc.balance) + service.downPayment }).eq('id', service.downPaymentAccountId);
                }

                // Kategori bul / oluştur
                const { data: existingCat } = await supabase
                    .from('finance_categories')
                    .select('id')
                    .eq('organization_id', organizationId)
                    .eq('name', 'Öğrenci Ücreti')
                    .eq('type', 'income')
                    .maybeSingle();

                let catId = existingCat?.id;
                if (!catId) {
                    const { data: newCat } = await supabase
                        .from('finance_categories')
                        .insert({
                            organization_id: organizationId,
                            name: 'Öğrenci Ücreti',
                            type: 'income',
                            icon: '🎓',
                        })
                        .select('id')
                        .single();
                    catId = newCat?.id;
                }

                if (catId) {
                    // İç Yüzde Peşinat KDV Ayrıştırması 
                    let sub = service.downPayment;
                    let vat = 0;
                    if (service.vatRate > 0) {
                        sub = Number((service.downPayment / (1 + service.vatRate / 100)).toFixed(2));
                        vat = Number((service.downPayment - sub).toFixed(2));
                    }

                    await supabase
                        .from('finance_transactions')
                        .insert({
                            organization_id: organizationId,
                            account_id: service.downPaymentAccountId,
                            category_id: catId,
                            service_id: service.serviceId,
                            subtotal: sub,
                            vat_rate: service.vatRate,
                            vat_amount: vat,
                            type: 'income',
                            amount: service.downPayment, // KDV Dahil Brüt
                            description: `Öğrenci Taksit Peşinatı (${service.serviceName || 'Hizmet'})`,
                            transaction_date: format(new Date(), 'yyyy-MM-dd'),
                            created_by: user.id
                        });
                }
            }
        }
    }

    return { success: true };
}
