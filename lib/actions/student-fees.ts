'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { StudentFee, FeeInstallment } from '@/types/accounting';

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
            due_date: dueDate.toISOString().split('T')[0],
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
 */
export async function cancelStudentFee(feeId: string): Promise<{ success: boolean; error?: string }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: updateError } = await supabase
        .from('student_fees')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', feeId);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
}
