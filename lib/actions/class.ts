'use server'

import { revalidatePath } from "next/cache";
import { Class, ClassWithCount } from "@/types/database";
import { getAuthContext } from "@/lib/auth-context";

export type ClassFormData = {
    name: string;
    grade_level: number;
}

export type GetClassesResponse =
    | { success: true; data: ClassWithCount[] }
    | { success: false; error: string };

// Tüm sınıfları getir (öğrenci sayısı ile birlikte)
export async function getClasses(): Promise<GetClassesResponse> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || "Unauthorized" };

    const { data, error: dbError } = await supabase
        .from('classes')
        .select('*, profiles(count)')
        .eq('organization_id', organizationId)
        .order('name');

    if (dbError) return { success: false, error: dbError.message };

    return { success: true, data };
}

// Yeni sınıf ekle
export async function addClass(formData: ClassFormData) {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || "Unauthorized" };

    const { error: dbError } = await supabase
        .from('classes')
        .insert({
            name: formData.name,
            grade_level: formData.grade_level,
            organization_id: organizationId
        });

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/classes');
    return { success: true };
}

// Sınıf güncelle
export async function updateClass(id: string, formData: ClassFormData) {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: dbError } = await supabase
        .from('classes')
        .update({
            name: formData.name,
            grade_level: formData.grade_level
        })
        .eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/classes');
    return { success: true };
}

// Sınıf sil
export async function deleteClass(id: string) {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: dbError } = await supabase.from('classes').delete().eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/classes');
    return { success: true };
}

// Tek sınıf bilgisi getir (detay sayfası için)
export async function getClassById(id: string) {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false as const, error: error || "Unauthorized" };

    // Sınıfı getir — sadece kendi organizasyonundaki
    const { data, error: dbError } = await supabase
        .from('classes')
        .select('*, profiles(count)')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

    if (dbError) return { success: false as const, error: dbError.message };
    if (!data) return { success: false as const, error: "Sınıf bulunamadı." };

    return { success: true as const, data: data as ClassWithCount };
}
