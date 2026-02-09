'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getStatusId(supabase: any, name: string) {
    const { data } = await supabase.from('study_session_statuses').select('id').eq('name', name).single();
    return data?.id;
}

export async function updateStudySessionStatus(sessionId: string, status: 'completed' | 'no_show') {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    )

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Yetkilendirme hatası: Oturum açmanız gerekiyor.' }
    }


    // Role check (Admin or Teacher)
    // We can use RPC or fetch profile manually.
    // Assuming simple RLS allows updates based on role.
    // Teachers can update their own sessions? Admins can update all?
    // Let's rely on RLS if possible, but for safety we can check role here.

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            organization_id,
            roles (*)
        `)
        .eq('id', user.id)
        .single();

    // Check if roles is an array or object (Supabase returns object for single relation usually, but let's be safe)
    // Actually standard join returns object if fk unique, or array.
    // Let's assume standard object based on typical setup.
    // Cast to any to avoid TS issues if types aren't perfect yet.
    const roleName = (profile?.roles as any)?.name;



    if (!roleName || (roleName !== 'admin' && roleName !== 'super_admin' && roleName !== 'teacher')) {
        return { error: `Yetkilendirme hatası: Bu işlem için yetkiniz yok. (Rol: ${roleName})` }
    }

    try {
        const statusId = await getStatusId(supabase, status);

        // Update status
        const { error } = await supabase
            .from('study_sessions')
            .update({ status_id: statusId })
            .eq('id', sessionId)

        if (error) throw error;
    } catch (e: any) {
        return { error: 'Güncelleme sırasında bir hata oluştu.' }
    }
    // Teachers can only update their own sessions in RLS, Admins can update org sessions.
    // We can add logic here: .eq('teacher_id', user.id) if specifically needed, 
    // but RLS is safer. Let's try direct update.



    revalidatePath('/admin/teachers/[id]', 'page');
    revalidatePath('/teacher/study-requests');
    revalidatePath('/teacher/schedule'); // Fix: Add this path

    return { success: true }
}
