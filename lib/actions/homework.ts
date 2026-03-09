'use server'

import { z } from 'zod';
import { revalidatePath } from "next/cache";
import { withAction } from "@/lib/actions/utils/with-action";

// Ödev sil
export const deleteHomework = withAction(
    z.object({ id: z.uuid() }),
    async ({ id }, ctx) => {
        const { error: dbError } = await ctx.supabase
            .from('homework')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (dbError) return { success: false, error: dbError.message };

        revalidatePath('/teacher/homework');
        return { success: true };
    }
);
