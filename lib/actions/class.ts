'use server'

import { z } from 'zod';
import { revalidatePath, unstable_cache } from "next/cache";
import { ClassWithCount } from "@/types/database";
import { withAction } from "@/lib/actions/utils/with-action";
import { supabaseAdmin } from '@/lib/supabase-admin';

export type ClassFormData = {
    name: string;
    grade_level: number;
}

export type GetClassesResponse =
    | { success: true; data: ClassWithCount[] }
    | { success: false; error: string };

const classFormSchema = z.object({
    name: z.string().min(1, 'Sınıf adı zorunludur.'),
    grade_level: z.number().int().min(1).max(13),
});

// Cached internal function — supabaseAdmin ile cache'lenir (RLS bypass)
const getCachedClasses = unstable_cache(
    async (organizationId: string) => {
        const { data, error } = await supabaseAdmin
            .from('classes')
            .select('*, profiles(count)')
            .eq('organization_id', organizationId)
            .order('name');

        if (error) throw error;
        return data as unknown as ClassWithCount[];
    },
    ['classes-list'],
    { tags: ['classes'], revalidate: 3600 }
);

// Tüm sınıfları getir
export const getClasses = withAction(async (ctx) => {
    const data = await getCachedClasses(ctx.organizationId);
    return { success: true, data };
});

// Yeni sınıf ekle
export const addClass = withAction(classFormSchema, async (formData, ctx) => {
    const role = ctx.user.app_metadata?.role;
    if (role !== 'admin' && role !== 'super_admin') {
        return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
    }

    const { error: dbError } = await ctx.supabase
        .from('classes')
        .insert({ name: formData.name, grade_level: formData.grade_level, organization_id: ctx.organizationId });

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/classes');
    return { success: true };
});

// Sınıf güncelle
export const updateClass = withAction(
    z.object({ id: z.string().uuid(), formData: classFormSchema }),
    async ({ id, formData }, ctx) => {
        const role = ctx.user.app_metadata?.role;
        if (role !== 'admin' && role !== 'super_admin') {
            return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
        }

        const { error: dbError } = await ctx.supabase
            .from('classes')
            .update({ name: formData.name, grade_level: formData.grade_level })
            .eq('id', id);

        if (dbError) return { success: false, error: dbError.message };

        revalidatePath('/admin/classes');
        return { success: true };
    }
);

// Sınıf sil (soft delete)
export const deleteClass = withAction(
    z.object({ id: z.string().uuid() }),
    async ({ id }, ctx) => {
        const role = ctx.user.app_metadata?.role;
        if (role !== 'admin' && role !== 'super_admin') {
            return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
        }

        const { error: dbError } = await ctx.supabase
            .from('classes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (dbError) return { success: false, error: dbError.message };

        revalidatePath('/admin/classes');
        return { success: true };
    }
);

// Tek sınıf bilgisi getir
export const getClassById = withAction(
    z.object({ id: z.string().uuid() }),
    async ({ id }, ctx) => {
        const { data, error: dbError } = await ctx.supabase
            .from('classes')
            .select('*, profiles(count)')
            .eq('id', id)
            .eq('organization_id', ctx.organizationId)
            .single();

        if (dbError) return { success: false, error: dbError.message };
        if (!data) return { success: false, error: 'Sınıf bulunamadı.' };

        return { success: true, data: data as ClassWithCount };
    }
);
