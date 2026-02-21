'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { StudentFee, FeeInstallment } from '@/types/accounting';
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
            classes:classes!class_id(name)
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
                classes:classes!class_id(name)
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
            await supabase
                .from('fee_installments')
                .update({ status: 'cancelled' })
                .in('id', pendingIds);
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
