'use server'

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { Class, ClassWithCount } from "@/types/database";
import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@supabase/supabase-js";

export type ClassFormData = {
    name: string;
    grade_level: number;
}

export type GetClassesResponse =
    | { success: true; data: ClassWithCount[] }
    | { success: false; error: string };

// Cached internal function
const getCachedClasses = unstable_cache(
    async (organizationId: string) => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from('classes')
            .select('*, profiles(count)')
            .eq('organization_id', organizationId)
            .order('name');

        if (error) throw error;
        // Fix: supabase-js returns raw data, ensure types match or cast if needed. 
        // profiles(count) returns { count: number } array usually, need to map if structure differs from ClassWithCount expectation?
        // Actually Supabase JS types are usually compatible if setup right.
        return data as unknown as ClassWithCount[];
    },
    ['classes-list'],
    {
        tags: ['classes'],
        revalidate: 3600
    }
);

// Tüm sınıfları getir (öğrenci sayısı ile birlikte)
export async function getClasses(): Promise<GetClassesResponse> {
    const { organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || "Unauthorized" };

    try {
        const data = await getCachedClasses(organizationId);
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// Yeni sınıf ekle
export async function addClass(formData: ClassFormData) {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || "Unauthorized" };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const { error: dbError } = await supabase
        .from('classes')
        .insert({
            name: formData.name,
            grade_level: formData.grade_level,
            organization_id: organizationId
        });

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/classes');

    // @ts-ignore
    revalidateTag('classes');
    return { success: true };
}

export async function updateClass(id: string, formData: ClassFormData) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { success: false, error: error || "Unauthorized" };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const { error: dbError } = await supabase
        .from('classes')
        .update({
            name: formData.name,
            grade_level: formData.grade_level
        })
        .eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/classes');

    // @ts-ignore
    revalidateTag('classes');
    return { success: true };
}

export async function deleteClass(id: string) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { success: false, error: error || "Unauthorized" };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const { error: dbError } = await supabase.from('classes').delete().eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/classes');

    // @ts-ignore
    revalidateTag('classes');
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
