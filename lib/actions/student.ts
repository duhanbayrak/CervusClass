'use server'

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Profile } from "@/types/database";
import { withAction } from "@/lib/actions/utils/with-action";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type StudentFormData = {
    full_name: string;
    email: string;
    password?: string;
    class_id: string;
    phone?: string;
    student_number?: string;
    parent_name?: string;
    parent_phone?: string;
    birth_date?: string;
}

export type GetStudentsResponse =
    | { success: true; data: Profile[]; count: number }
    | { success: false; error: string };

const studentFormSchema = z.object({
    full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır.'),
    email: z.email('Geçerli bir e-posta giriniz.'),
    password: z.string().optional(),
    class_id: z.uuid(),
    phone: z.string().optional(),
    student_number: z.string().optional(),
    parent_name: z.string().optional(),
    parent_phone: z.string().optional(),
    birth_date: z.string().optional(),
});

// Öğrencileri getir — arama, sınıf filtresi ve sayfalama destekli
export const getStudents = withAction(
    z.object({
        search: z.string().optional(),
        classId: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
    }),
    async ({ search, classId, page, limit }, ctx) => {
        let query = ctx.supabase
            .from('profiles')
            .select('*, class:classes(id, name, grade_level), roles!inner(name)', { count: 'exact' })
            .eq('organization_id', ctx.organizationId)
            .eq('roles.name', 'student')
            .is('deleted_at', null);

        if (search) {
            query = query.textSearch('search_vector', search, { config: 'turkish', type: 'plain' });
        }
        if (classId && classId !== 'all') {
            query = query.eq('class_id', classId);
        }

        const from = (page - 1) * limit;
        const { data, count, error: dbError } = await query
            .range(from, from + limit - 1)
            .order('full_name', { ascending: true });

        if (dbError) return { success: false, error: dbError.message };
        return { success: true, data: { students: (data || []) as any, count: count || 0 } };
    }
);

// Yeni öğrenci ekle
export const addStudent = withAction(studentFormSchema, async (formData, ctx) => {
    const role = ctx.user.app_metadata?.role;
    if (role !== 'admin' && role !== 'super_admin') {
        return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
    }

    const { data: studentRole } = await ctx.supabase.from('roles').select('id').eq('name', 'student').single();
    if (!studentRole) return { success: false, error: 'Öğrenci rolü bulunamadı.' };

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password || 'temppass123',
        email_confirm: true,
        user_metadata: { full_name: formData.full_name, role: 'student' },
    });

    if (authError) return { success: false, error: authError.message };

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        full_name: formData.full_name,
        email: formData.email,
        class_id: formData.class_id,
        phone: formData.phone || null,
        student_number: formData.student_number || null,
        parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone || null,
        birth_date: formData.birth_date || null,
        organization_id: ctx.organizationId,
        role_id: studentRole.id,
    });

    if (profileError) return { success: false, error: profileError.message };

    revalidatePath('/admin/students');
    return { success: true, data: authData.user };
});

function buildStudentUpdatePayload(formData: Partial<{ full_name: string; email: string; class_id: string; phone: string; student_number: string; parent_name: string; parent_phone: string; birth_date: string; password: string }>): Record<string, string | null> {
    const p: Record<string, string | null> = {}
    if (formData.full_name) p.full_name = formData.full_name
    if (formData.email) p.email = formData.email
    if (formData.class_id) p.class_id = formData.class_id
    if (formData.phone !== undefined) p.phone = formData.phone || null
    if (formData.student_number !== undefined) p.student_number = formData.student_number || null
    if (formData.parent_name !== undefined) p.parent_name = formData.parent_name || null
    if (formData.parent_phone !== undefined) p.parent_phone = formData.parent_phone || null
    if (formData.birth_date !== undefined) p.birth_date = formData.birth_date || null
    return p
}

// Öğrenci güncelle
export const updateStudent = withAction(
    z.object({ id: z.uuid(), formData: studentFormSchema.partial() }),
    async ({ id, formData }, ctx) => {
        const role = ctx.user.app_metadata?.role;
        if (role !== 'admin' && role !== 'super_admin') {
            return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
        }

        const updatePayload = buildStudentUpdatePayload(formData)
        const { data: updatedRows, error: updateError } = await supabaseAdmin.from('profiles').update(updatePayload).eq('id', id).select('email');
        if (updateError) return { success: false, error: 'Profil güncellenirken hata: ' + updateError.message };
        if (!updatedRows || updatedRows.length === 0) return { success: false, error: 'Güncellenecek profil bulunamadı.' };

        const emailChanged = formData.email && formData.email !== updatedRows[0]?.email;
        const passwordProvided = formData.password && formData.password.length > 0;

        if (emailChanged || passwordProvided) {
            const updateData: Record<string, string> = {};
            if (emailChanged && formData.email) updateData.email = formData.email;
            if (passwordProvided && formData.password) updateData.password = formData.password;
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
            if (authError) return { success: false, error: 'Profil güncellendi ancak Auth güncellemesi başarısız: ' + authError.message };
        }

        revalidatePath('/admin/students');
        revalidatePath(`/admin/students/${id}`);
        return { success: true };
    }
);

// Öğrenci sil (soft delete)
export const deleteStudent = withAction(
    z.object({ id: z.uuid() }),
    async ({ id }, ctx) => {
        const role = ctx.user.app_metadata?.role;
        if (role !== 'admin' && role !== 'super_admin') {
            return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
        }

        const { error: dbError } = await supabaseAdmin.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (dbError) return { success: false, error: dbError.message };

        revalidatePath('/admin/students');
        return { success: true };
    }
);
