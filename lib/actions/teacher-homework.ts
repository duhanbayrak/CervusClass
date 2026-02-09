'use server'

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function assessHomework(submissionId: string, status: 'approved' | 'rejected' | 'pending', feedback?: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Verify teacher role (optional, RLS handles it but good for early exit)

    const { error } = await supabase
        .from('homework_submissions')
        .update({
            status: status,
            teacher_feedback: feedback
        })
        .eq('id', submissionId);

    if (error) {

        return { error: 'İşlem sırasında hata oluştu.' };
    }

    revalidatePath('/teacher/homework');
    return { success: true };
}
