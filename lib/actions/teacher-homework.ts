'use server'

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { withAction } from '@/lib/actions/utils/with-action';

// Ödev değerlendir
export const assessHomework = withAction(
    z.object({
        submissionId: z.string().uuid(),
        status: z.enum(['approved', 'rejected', 'pending']),
        feedback: z.string().optional(),
    }),
    async ({ submissionId, status, feedback }, ctx) => {
        const { error: dbError } = await ctx.supabase
            .from('homework_submissions')
            .update({ status, teacher_feedback: feedback })
            .eq('id', submissionId);

        if (dbError) return { success: false, error: 'İşlem sırasında hata oluştu.' };

        revalidatePath('/teacher/homework');
        return { success: true };
    }
);
