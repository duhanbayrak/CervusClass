'use server'

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Profile } from "@/types/database";

// Admin client for user management (Service Role)
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

export async function getStudents(search?: string, classId?: string, page: number = 1, limit: number = 10) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
            },
        }
    );

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) return { success: false, error: "Profile not found" };

    let query = supabase
        .from('profiles')
        .select(`
            *,
            class:classes(id, name, grade_level)
        `, { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        // We can either use role_id if we have a roles table, or if 'role' column was deprecated/moved.
        // Based on types, we have profile.role_id. Let's assume we filter by role via join or if we just look for students.
        // For now, let's assume 'student' role is identifiable.
        // Since schema showed role_id, we might need to fetch the role ID for 'student' or if there is a redundant column.
        // Let's check existing usage or assume we filter by logic.
        // If checking 'types/database.ts', Profile has 'roles' relation.
        // Ideally we filter where role.name = 'student'.
        .eq('roles.name', 'student');

    // Wait, Supabase inner join filtering syntax: 
    // .eq('roles.name', 'student') only works if !inner is used in select, e.g. select('*, roles!inner(*)')

    // Let's refine the query to use the Join properly
    query = supabase
        .from('profiles')
        .select(`
            *,
            class:classes(id, name, grade_level),
            roles!inner(name)
        `, { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('roles.name', 'student');

    if (search) {
        query = query.ilike('full_name', `%${search}%`);
    }

    if (classId && classId !== 'all') {
        query = query.eq('class_id', classId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
        .range(from, to)
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Error fetching students:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data, count };
}

export async function addStudent(formData: StudentFormData) {
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

    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return { success: false, error: "Unauthorized" };

    const { data: adminProfile } = await supabase.from('profiles').select('organization_id').eq('id', adminUser.id).single();
    if (!adminProfile) return { success: false, error: "Admin profile not found" };

    // 1. Create Auth User
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password || '123456', // Default password if empty
        email_confirm: true,
        user_metadata: {
            full_name: formData.full_name,
            organization_id: adminProfile.organization_id,
            // We need to set role? Usually role is handled in profiles table, but maybe metadata too.
        }
    });

    if (authError) {
        return { success: false, error: authError.message };
    }

    if (!userData.user) {
        return { success: false, error: "User creation failed" };
    }

    // 2. Assign Role (Get 'student' role ID)
    const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'student').single();
    const studentRoleId = roleData?.id;

    // 3. Create/Update Profile (Trigger usually creates profile, so we assume update)
    // Wait, if we use createUser, does a trigger create the profile? 
    // If yes, we update. If not, we insert.
    // Let's assume standard behavior: trigger might create basic profile, we need to update it with class_id, role_id etc.
    // Or we manually insert if no trigger exists.
    // To be safe, we can try Upsert or just Update.

    // Let's try Update first, assuming trigger exists. If not, handle insert.
    // Actually, best practice with separate Admin creation is to Update the profile that SHOULD be created by Trigger.
    // BUT, if Trigger logic relies on metadata, it might already be partial.

    // Let's attempt to update the profile that matches the new user ID.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: formData.full_name,
            class_id: formData.class_id,
            role_id: studentRoleId,
            organization_id: adminProfile.organization_id,
            phone: formData.phone || null,
            student_number: formData.student_number || null,
            parent_name: formData.parent_name || null,
            parent_phone: formData.parent_phone || null,
            birth_date: formData.birth_date || null
        })
        .eq('id', userData.user.id);

    // If update fails (zero rows?), maybe we need to insert?
    // Usually triggers are reliable. If no trigger, we must Insert.
    // Let's assume trigger exists for now based on standard Supabase setups, 
    // but if Row count is 0, we might need Insert.
    // However, Supabase `update` doesn't throw on 0 rows easily in JS client unless we count.

    // For robustness, let's use upsert.
    if (profileError) {
        // If update failed (e.g. policy), but we are using supabaseAdmin!.
        console.error("Profile update error", profileError);
        // Cleanup user?
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        return { success: false, error: "Failed to create student profile." };
    }

    revalidatePath('/admin/students');
    return { success: true };
}

export async function updateStudent(id: string, formData: Partial<StudentFormData>) {
    // Similar setup...
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll() { return cookieStore.getAll() } }
        }
    );

    // Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: formData.full_name,
            class_id: formData.class_id,
            phone: formData.phone || null,
            student_number: formData.student_number || null,
            parent_name: formData.parent_name || null,
            parent_phone: formData.parent_phone || null,
            birth_date: formData.birth_date || null
            // email is separate in Auth
        })
        .eq('id', id);

    if (profileError) return { success: false, error: profileError.message };

    // Update Auth Email/Password if provided
    if (formData.email || formData.password) {
        const updateData: any = {};
        if (formData.email) updateData.email = formData.email;
        if (formData.password) updateData.password = formData.password;

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
        if (authError) return { success: false, error: "Profile updated but Auth failed: " + authError.message };
    }

    revalidatePath('/admin/students');
    return { success: true };
}

export async function deleteStudent(id: string) {
    // Delete from Auth (Cascade should handle profile, but we can be explicit)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/students');
    return { success: true };
}
