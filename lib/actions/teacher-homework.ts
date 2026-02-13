'use server'

import { revalidatePath } from 'next/cache';
import { getAuthContext } from '@/lib/auth-context';

// Ödev değerlendir
export async function assessHomework(submissionId: string, status: 'approved' | 'rejected' | 'pending', feedback?: string) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { error: error || 'Unauthorized' };

    const { error: dbError } = await supabase
        .from('homework_submissions')
        .update({
            status: status,
            teacher_feedback: feedback
        })
        .eq('id', submissionId);

    if (dbError) return { error: 'İşlem sırasında hata oluştu.' };

    revalidatePath('/teacher/homework');
    return { success: true };
}
