'use server'

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";

// Ödev sil
export async function deleteHomework(id: string) {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: dbError } = await supabase
        .from('homework')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/teacher/homework');
    return { success: true };
}
