'use server'

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type ClassFormData = {
    name: string;
    grade_level: number;
}

export async function getClasses() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) return { success: false, error: "Profile not found" };

    const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade_level')
        .eq('organization_id', profile.organization_id)
        .order('name');

    if (error) {

        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function addClass(formData: ClassFormData) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) return { success: false, error: "Profile not found" };

    const { error } = await supabase
        .from('classes')
        .insert({
            name: formData.name,
            grade_level: formData.grade_level,
            organization_id: profile.organization_id
        });

    if (error) {

        return { success: false, error: error.message };
    }

    revalidatePath('/admin/classes');
    return { success: true };
}

export async function updateClass(id: string, formData: ClassFormData) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    );

    const { error } = await supabase
        .from('classes')
        .update({
            name: formData.name,
            grade_level: formData.grade_level
        })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/classes');
    return { success: true };
}

export async function deleteClass(id: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    );

    // Optional: Check if class has students or schedule items before deleting
    // Suppressing checks for now, assuming cascade or user awareness, but good practice to check logic.
    // Constraints usually handle this if set up in DB.

    const { error } = await supabase.from('classes').delete().eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/classes');
    return { success: true };
}
