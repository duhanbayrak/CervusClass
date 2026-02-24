'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const getAuthContext = async () => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) {
                        // ignored
                    }
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Oturum açmanız gerekiyor.');
    }

    // Get organization_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        throw new Error('Kurum bilgisi bulunamadı.');
    }

    return { supabase, user, organizationId: profile.organization_id };
};

export async function addStudentNote(studentId: string, content: string) {
    try {
        const { supabase, user, organizationId } = await getAuthContext();

        const { error } = await supabase
            .from('student_notes')
            .insert({
                organization_id: organizationId,
                student_id: studentId,
                teacher_id: user.id,
                content: content
            });

        if (error) throw error;

        revalidatePath(`/teacher/students/${studentId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Add note error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteStudentNote(noteId: string, studentId: string) {
    try {
        const { supabase } = await getAuthContext();

        const { error } = await supabase
            .from('student_notes')
            .delete()
            .eq('id', noteId);

        if (error) throw error;

        revalidatePath(`/teacher/students/${studentId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Delete note error:', error);
        return { success: false, error: error.message };
    }
}
