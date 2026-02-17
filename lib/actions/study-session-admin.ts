'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/lib/auth-context'
import { type SupabaseClient } from '@supabase/supabase-js'
import { handleError } from '@/lib/utils/error'

// Status ID helper
async function getStatusId(supabase: SupabaseClient, name: string) {
    const { data } = await supabase.from('study_session_statuses').select('id').eq('name', name).single();
    return data?.id;
}

// Etüt oturumu durumunu güncelle (admin/öğretmen)
export async function updateStudySessionStatus(sessionId: string, status: 'completed' | 'no_show') {
    const { supabase, user, organizationId, error } = await getAuthContext();
    if (error || !user || !organizationId) return { error: error || 'Yetkilendirme hatası: Oturum açmanız gerekiyor.' };

    // Rol kontrolü
    const { data: profile } = await supabase
        .from('profiles')
        .select(`roles(name)`)
        .eq('id', user.id)
        .single();

    const roleName = (profile?.roles as Record<string, string> | null)?.name;

    if (!roleName || (roleName !== 'admin' && roleName !== 'super_admin' && roleName !== 'teacher')) {
        return { error: `Yetkilendirme hatası: Bu işlem için yetkiniz yok. (Rol: ${roleName})` };
    }

    try {
        const statusId = await getStatusId(supabase, status);

        // Durumu güncelle
        const { error: dbError } = await supabase
            .from('study_sessions')
            .update({ status_id: statusId })
            .eq('id', sessionId);

        if (dbError) throw dbError;
    } catch (e: unknown) {
        return { error: `Güncelleme sırasında bir hata oluştu: ${handleError(e)}` };
    }

    revalidatePath('/admin/teachers/[id]', 'page');
    revalidatePath('/teacher/study-requests');
    revalidatePath('/teacher/schedule');

    return { success: true };
}

// Hata yönetimi helper kaldırıldı -> lib/utils/error.ts kullanılıyor
