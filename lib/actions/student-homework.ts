'use server'

import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { getAuthContext } from '@/lib/auth-context';

// Ödev teslim et
export async function submitHomework(homeworkId: string) {
    const { supabase, user, organizationId, error } = await getAuthContext();
    if (error || !user || !organizationId) return { error: error || 'Unauthorized' };

    // Admin client — RLS bypass gerekli (öğrenciler INSERT yapamaz)
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            }
        }
    );

    // Mevcut teslim var mı kontrol et
    const { data: existingSubmission } = await supabaseAdmin
        .from('homework_submissions')
        .select('id')
        .eq('homework_id', homeworkId)
        .eq('student_id', user.id)
        .single();

    let actionError;

    if (existingSubmission) {
        // Güncelle
        const { error: updateError } = await supabaseAdmin
            .from('homework_submissions')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString()
            })
            .eq('id', existingSubmission.id);
        actionError = updateError;
    } else {
        // Yeni teslim oluştur
        const { error: insertError } = await supabaseAdmin
            .from('homework_submissions')
            .insert({
                homework_id: homeworkId,
                student_id: user.id,
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                organization_id: organizationId
            });
        actionError = insertError;
    }

    if (actionError) {
        return { error: 'Teslim edilirken bir hata oluştu: ' + actionError.message };
    }

    revalidatePath('/student/homework');
    return { success: true };
}
