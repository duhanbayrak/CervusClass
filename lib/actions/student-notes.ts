'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { withAction } from '@/lib/actions/utils/with-action';

export const addStudentNote = withAction(
    z.object({
        studentId: z.string().uuid(),
        content: z.string().min(1, 'Not içeriği boş olamaz.'),
    }),
    async ({ studentId, content }, ctx) => {
        const { error } = await ctx.supabase
            .from('student_notes')
            .insert({
                organization_id: ctx.organizationId,
                student_id: studentId,
                teacher_id: ctx.user.id,
                content,
            });

        if (error) return { success: false, error: error.message };

        revalidatePath(`/teacher/students/${studentId}`);
        return { success: true };
    }
);

export const deleteStudentNote = withAction(
    z.object({
        noteId: z.string().uuid(),
        studentId: z.string().uuid(),
    }),
    async ({ noteId, studentId }, ctx) => {
        const { error } = await ctx.supabase
            .from('student_notes')
            .delete()
            .eq('id', noteId);

        if (error) return { success: false, error: error.message };

        revalidatePath(`/teacher/students/${studentId}`);
        return { success: true };
    }
);
