'use server'

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { withAction } from '@/lib/actions/utils/with-action';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Ödev teslim et — RLS bypass gerekli (öğrenciler INSERT yapamaz)
export const submitHomework = withAction(
    z.object({ homeworkId: z.string().uuid() }),
    async ({ homeworkId }, ctx) => {
        const { data: existingSubmission } = await supabaseAdmin
            .from('homework_submissions')
            .select('id')
            .eq('homework_id', homeworkId)
            .eq('student_id', ctx.user.id)
            .single();

        let actionError;

        if (existingSubmission) {
            const { error } = await supabaseAdmin
                .from('homework_submissions')
                .update({ status: 'submitted', submitted_at: new Date().toISOString() })
                .eq('id', existingSubmission.id);
            actionError = error;
        } else {
            const { error } = await supabaseAdmin
                .from('homework_submissions')
                .insert({
                    homework_id: homeworkId,
                    student_id: ctx.user.id,
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    organization_id: ctx.organizationId,
                });
            actionError = error;
        }

        if (actionError) return { success: false, error: 'Teslim edilirken bir hata oluştu: ' + actionError.message };

        revalidatePath('/student/homework');
        return { success: true };
    }
);
