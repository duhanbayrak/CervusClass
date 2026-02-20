'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { StudentFee, FeeInstallment } from '@/types/accounting';

/**
 * Giriş yapan öğrencinin kendi ücret kayıtlarını getirir.
 */
export async function getMyFees(): Promise<StudentFee[]> {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return [];

    const { data, error: fetchError } = await supabase
        .from('student_fees')
        .select(`
            *,
            classes:classes!class_id(name)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

    if (fetchError) return [];
    return (data || []) as StudentFee[];
}

/**
 * Giriş yapan öğrencinin bir ücret kaydının taksit detaylarını getirir.
 */
export async function getMyInstallments(feeId: string): Promise<FeeInstallment[]> {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return [];

    // Önce bu ücretin gerçekten bu öğrenciye ait olduğunu doğrula
    const { data: fee } = await supabase
        .from('student_fees')
        .select('id')
        .eq('id', feeId)
        .eq('student_id', user.id)
        .single();

    if (!fee) return [];

    const { data, error: fetchError } = await supabase
        .from('fee_installments')
        .select('*')
        .eq('fee_id', feeId)
        .order('installment_number', { ascending: true });

    if (fetchError) return [];
    return (data || []) as FeeInstallment[];
}
