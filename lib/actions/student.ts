'use server'

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { Profile } from "@/types/database";
import { getAuthContext } from "@/lib/auth-context";

// Admin client — Auth API (kullanıcı oluşturma/güncelleme) için gerekli
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

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

// Öğrencileri getir — arama, sınıf filtresi ve sayfalama destekli
export async function getStudents(search?: string, classId?: string, page: number = 1, limit: number = 10) {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || "Unauthorized" };

    // Sorguyu oluştur — roles!inner ile sadece öğrencileri filtrele
    let query = supabase
        .from('profiles')
        .select(`
            *,
            class:classes(id, name, grade_level),
            roles!inner(name)
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('roles.name', 'student');

    // Arama filtresi
    if (search) {
        query = query.ilike('full_name', `%${search}%`);
    }

    // Sınıf filtresi
    if (classId && classId !== 'all') {
        query = query.eq('class_id', classId);
    }

    // Sayfalama
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error: dbError } = await query
        .range(from, to)
        .order('full_name', { ascending: true });

    if (dbError) return { success: false, error: dbError.message };

    return { success: true, data, count };
}

// Yeni öğrenci ekle
export async function addStudent(formData: StudentFormData) {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || "Unauthorized" };

    // Öğrenci rolünü bul
    const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single();

    if (!role) return { success: false, error: "Öğrenci rolü bulunamadı." };

    // Auth kullanıcısı oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password || 'temppass123',
        email_confirm: true,
        user_metadata: {
            full_name: formData.full_name,
            role: 'student'
        }
    });

    if (authError) return { success: false, error: authError.message };

    // Profil oluştur
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: formData.full_name,
            email: formData.email,
            class_id: formData.class_id,
            phone: formData.phone || null,
            student_number: formData.student_number || null,
            parent_name: formData.parent_name || null,
            parent_phone: formData.parent_phone || null,
            birth_date: formData.birth_date || null,
            organization_id: organizationId,
            role_id: role.id
        })
        .eq('id', authData.user.id);

    if (profileError) return { success: false, error: profileError.message };

    revalidatePath('/admin/students');
    return { success: true, data: authData.user };
}

// Öğrenci güncelle
export async function updateStudent(id: string, formData: Partial<StudentFormData>) {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    // Profil güncelle — supabaseAdmin ile RLS bypass
    const updatePayload: Record<string, string | null> = {};
    if (formData.full_name) updatePayload.full_name = formData.full_name;
    if (formData.email) updatePayload.email = formData.email;
    if (formData.class_id) updatePayload.class_id = formData.class_id;
    if (formData.phone !== undefined) updatePayload.phone = formData.phone || null;
    if (formData.student_number !== undefined) updatePayload.student_number = formData.student_number || null;
    if (formData.parent_name !== undefined) updatePayload.parent_name = formData.parent_name || null;
    if (formData.parent_phone !== undefined) updatePayload.parent_phone = formData.parent_phone || null;
    if (formData.birth_date !== undefined) updatePayload.birth_date = formData.birth_date || null;

    const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)
        .select('email');

    if (updateError) return { success: false, error: "Profil güncellenirken hata: " + updateError.message };

    if (!updatedRows || updatedRows.length === 0) {
        return { success: false, error: "Güncellenecek profil bulunamadı." };
    }

    // Auth Email/Password güncelleme — sadece değişiklik varsa
    const currentEmail = updatedRows[0]?.email;
    const emailChanged = formData.email && formData.email !== currentEmail;
    const passwordProvided = formData.password && formData.password.length > 0;

    if (emailChanged || passwordProvided) {
        const updateData: Record<string, string> = {};
        if (emailChanged) updateData.email = formData.email!;
        if (passwordProvided) updateData.password = formData.password!;

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
        if (authError) return { success: false, error: "Profil güncellendi ancak Auth güncellemesi başarısız: " + authError.message };
    }

    revalidatePath('/admin/students');
    revalidatePath(`/admin/students/${id}`);
    return { success: true };
}

// Öğrenci sil
export async function deleteStudent(id: string) {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: dbError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/students');
    return { success: true };
}
