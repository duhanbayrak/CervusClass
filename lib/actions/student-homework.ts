'use server'

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function submitHomework(homeworkId: string) {
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

    // Get Organization ID (Required for Insert if record missing)
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    // Initialize Admin Client for UPSERT ensuring we bypass RLS insert restrictions for students
    // (Students normally can't INSERT, only UPDATE, but for legacy homeworks we need to insert)
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

    // Check if submission exists using Admin client to see all records
    const { data: existingSubmission, error: fetchError } = await supabaseAdmin
        .from('homework_submissions')
        .select('id')
        .eq('homework_id', homeworkId)
        .eq('student_id', user.id)
        .single();

    // .single() returns error if no rows found (PGRST116) or multiple rows.
    // We handle "no rows" as case for INSERT.

    let actionError;

    if (existingSubmission) {

        const { error: updateError } = await supabaseAdmin
            .from('homework_submissions')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString()
            })
            .eq('id', existingSubmission.id);
        actionError = updateError;
    } else {

        const { error: insertError } = await supabaseAdmin
            .from('homework_submissions')
            .insert({
                homework_id: homeworkId,
                student_id: user.id,
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                organization_id: profile.organization_id
            });
        actionError = insertError;
    }

    if (actionError) {

        return { error: 'Teslim edilirken bir hata oluştu: ' + actionError.message };
    }


    revalidatePath('/student/homework');
    return { success: true };
}
