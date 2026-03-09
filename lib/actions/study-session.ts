'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { type SupabaseClient } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/auth-context'
import { handleError } from '@/lib/utils/error'
import { createNotification } from '@/lib/actions/notifications'

// Status ID helper
async function getStatusId(supabase: SupabaseClient, name: string) {
    const { data } = await supabase.from('study_session_statuses').select('id').eq('name', name).single();
    return data?.id;
}

// Oturum yetki kontrolü: session'ı getirir ve öğretmen/admin doğrulaması yapar.
// Hata durumunda { error } döner; başarıda { session } döner.
async function fetchSessionAndCheckAccess(
    supabase: SupabaseClient,
    sessionId: string,
    userId: string,
    userRole: string,
): Promise<
    | { session: { teacher_id: string | null; student_id: string | null }; error?: never }
    | { error: string; session?: never }
> {
    const { data: session, error: sessionError } = await supabase
        .from('study_sessions')
        .select('teacher_id, student_id')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) return { error: 'Oturum bulunamadı.' };

    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    if (!isAdmin && session.teacher_id !== userId) {
        return { error: 'Bu işlemi sadece ilgili öğretmen veya yönetici yapabilir.' };
    }

    return { session };
}

// Öğretmenleri getir
export async function getTeachers() {
    try {
        const { organizationId, error } = await getAuthContext();
        if (error || !organizationId) return { error: error || 'Oturum bulunamadı' };

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return { error: 'CRITICAL: Service Role Key missing in server environment' };
        }

        // Öğretmen rolünü bul
        const { data: role, error: roleError } = await supabaseAdmin.from('roles').select('id, name').eq('name', 'teacher').single();

        if (roleError || !role) {
            return { error: `Rol bulma hatası: ${roleError?.message} (Aranan: 'teacher')` };
        }

        // Öğretmenleri getir — Admin client ile
        const { data: teachers, error: teachersError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .eq('role_id', role.id)
            .eq('organization_id', organizationId)
            .order('full_name');

        if (teachersError) {
            return { error: `Öğretmen sorgu hatası: ${teachersError.message}` };
        }

        if (!teachers || teachers.length === 0) {
            return { error: `Sorgu başarılı ama 0 öğretmen döndü. (Org: ${organizationId}, Role: ${role.id})` };
        }

        return { data: teachers };
    } catch (err: unknown) {
        return { error: `Beklenmedik Server Hatası: ${handleError(err)}` };
    }
}

// Öğretmen takvimini ve etüt oturumlarını getir
export async function getTeacherSchedule(teacherId: string) {
    try {
        const { user, organizationId, error } = await getAuthContext();
        if (error || !user || !organizationId) return { schedule: [], sessions: [], teacherName: '', error: error || 'User not found' };

        // Etüt oturumlarını getir — Admin client ile
        const { data: rawSessions, error: sessionError } = await supabaseAdmin
            .from('study_sessions')
            .select('*, study_session_statuses(name)')
            .eq('teacher_id', teacherId)
            .eq('organization_id', organizationId)
            .gt('scheduled_at', new Date().toISOString());

        if (sessionError) {
            return { schedule: [], sessions: [], teacherName: '', error: sessionError.message };
        }

        // Status adını güvenli al
        const getStatus = (s: any) => s.study_session_statuses?.name;

        // Oturumları sanitize et — başkalarının detaylarını gizle
        const sessions = rawSessions?.filter(s => getStatus(s) !== 'cancelled').map(session => {
            const status = getStatus(session);
            const isMySession = session.student_id === user.id;
            const isAvailable = status === 'available';

            const sessionWithStatus = { ...session, status };

            if (isAvailable || isMySession) {
                return sessionWithStatus;
            } else {
                // Başkalarının bilgilerini gizle
                return {
                    ...sessionWithStatus,
                    topic: 'Dolu',
                    student_id: null
                };
            }
        });

        // Öğretmen bilgisi
        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', teacherId).single();

        return {
            schedule: [],
            sessions: sessions || [],
            teacherName: profile?.full_name
        };
    } catch (e: unknown) {
        return { schedule: [], sessions: [], teacherName: '', error: handleError(e) };
    }
}

// Müsaitlik oluştur (öğretmen)
export async function createAvailability(date: string, startTime: string, endTime: string, slotCount: number = 1) {
    const { supabase, user, organizationId, error } = await getAuthContext();
    if (error || !user || !organizationId) return { error: error || 'Unauthorized' };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'teacher' && userRole !== 'admin' && userRole !== 'super_admin') {
        return { error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
    }

    // Zaman damgaları hesapla (Türkiye saati +03:00)
    const startDateTime = new Date(`${date}T${startTime}:00+03:00`);
    const endDateTime = new Date(`${date}T${endTime}:00+03:00`);

    if (startDateTime < new Date()) {
        return { error: 'Geçmiş bir tarihe etüt ekleyemezsiniz.' };
    }

    if (endDateTime <= startDateTime) {
        return { error: 'Bitiş saati başlangıç saatinden sonra olmalıdır.' };
    }

    // Çakışma kontrolü (Tüm blok için yapıyoruz)
    const conflictResult = await checkAvailabilityConflicts(supabase, user.id, date, startDateTime, endDateTime);
    if (conflictResult.error) {
        return { error: conflictResult.error };
    }

    try {
        const availableId = await getStatusId(supabaseAdmin, 'available');
        
        // Toplam süreyi dakika cinsinden bul
        const totalMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
        const slotDuration = totalMinutes / slotCount;

        const sessionsToInsert = [];

        for (let i = 0; i < slotCount; i++) {
            const slotStart = new Date(startDateTime.getTime() + (i * slotDuration * 60 * 1000));
            const slotEnd = new Date(startDateTime.getTime() + ((i + 1) * slotDuration * 60 * 1000));

            sessionsToInsert.push({
                teacher_id: user.id,
                organization_id: organizationId,
                student_id: null,
                status_id: availableId,
                scheduled_at: slotStart.toISOString(),
                end_time: slotEnd.toISOString(),
                topic: ''
            });
        }

        const { error: dbError } = await supabase.from('study_sessions').insert(sessionsToInsert);

        if (dbError) throw dbError;
    } catch (e: unknown) {
        return { error: handleError(e) || 'Kayıt hatası' };
    }

    revalidatePath('/teacher/schedule');
    revalidatePath('/teacher/study-requests');
    revalidatePath('/teacher/dashboard');
    revalidatePath('/student/study-requests');
    return { success: true };
}

// Öğrenci etüt talebi
export async function requestSession(sessionId: string, topic: string) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { error: error || 'Unauthorized' };

    // Yetki Kontrolü - Sadece öğrenciler talep edebilir
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'student') {
        return { error: 'Sadece öğrenciler etüt talebinde bulunabilir.' };
    }

    try {
        const pendingId = await getStatusId(supabaseAdmin, 'pending');
        const availableId = await getStatusId(supabaseAdmin, 'available');

        // Önce session'ın teacher_id'sini al
        const { data: sessionData } = await supabase
            .from('study_sessions')
            .select('teacher_id')
            .eq('id', sessionId)
            .eq('status_id', availableId)
            .single();

        const { error: dbError } = await supabase
            .from('study_sessions')
            .update({
                student_id: user.id,
                status_id: pendingId,
                topic: topic
            })
            .eq('id', sessionId)
            .eq('status_id', availableId);

        if (dbError) throw dbError;

        // Öğretmene bildirim gönder
        if (sessionData?.teacher_id) {
            const { data: studentProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            const studentName = studentProfile?.full_name || 'Bir öğrenci';
            const topicSuffix = topic ? `: ${topic}` : '';
            await createNotification({
                userId: sessionData.teacher_id,
                title: 'Yeni Etüt Talebi 📚',
                message: `${studentName} etüt talebinde bulundu${topicSuffix}.`,
                type: 'info',
            });
        }
    } catch (e: unknown) {
        return { error: handleError(e) };
    }

    revalidatePath('/student/study-requests');
    revalidatePath('/teacher/study-requests');
    revalidatePath('/teacher/dashboard');
    revalidatePath('/teacher/schedule');
    return { success: true };
}

// Etüt onayla
export async function approveSession(sessionId: string) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { error: error || "Unauthorized" };

    try {
        const userRole = user.app_metadata?.role || user.user_metadata?.role;
        const authResult = await fetchSessionAndCheckAccess(supabase, sessionId, user.id, userRole);
        if (authResult.error) return { error: authResult.error };
        const { session } = authResult;
        if (!session) return { error: 'Oturum bulunamadı.' };

        const approvedId = await getStatusId(supabaseAdmin, 'approved');
        const { error: dbError } = await supabase
            .from('study_sessions')
            .update({ status_id: approvedId })
            .eq('id', sessionId);

        if (dbError) throw dbError;

        // Öğrenciye bildirim gönder
        if (session.student_id) {
            await createNotification({
                userId: session.student_id,
                title: 'Etüt Talebi Onaylandı ✅',
                message: 'Etüt talebiniz onaylandı. Takviminizdeki detayları kontrol edin.',
                type: 'success',
            });
        }
    } catch (e: unknown) {
        return { error: handleError(e) };
    }

    revalidatePath('/teacher/schedule');
    return { success: true };
}

// Etüt reddet
export async function rejectSession(sessionId: string, reason?: string) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { error: error || "Unauthorized" };

    try {
        const userRole = user.app_metadata?.role || user.user_metadata?.role;
        const authResult = await fetchSessionAndCheckAccess(supabase, sessionId, user.id, userRole);
        if (authResult.error) return { error: authResult.error };
        const { session } = authResult;
        if (!session) return { error: 'Oturum bulunamadı.' };

        const rejectedId = await getStatusId(supabaseAdmin, 'rejected');

        const { error: dbError } = await supabase
            .from('study_sessions')
            .update({
                status_id: rejectedId,
                rejection_reason: reason
            })
            .eq('id', sessionId);

        if (dbError) throw dbError;

        // Öğrenciye bildirim gönder
        if (session.student_id) {
            await createNotification({
                userId: session.student_id,
                title: 'Etüt Talebi Reddedildi ❌',
                message: reason ? `Etüt talebiniz reddedildi. Sebep: ${reason}` : 'Etüt talebiniz reddedildi.',
                type: 'warning',
            });
        }
    } catch (e: unknown) {
        return { error: handleError(e) };
    }

    revalidatePath('/teacher/study-requests');
    revalidatePath('/teacher/dashboard');
    revalidatePath('/teacher/schedule');
    return { success: true };
}

// Etüt iptal
export async function cancelSession(sessionId: string) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { error: error || "Unauthorized" };

    try {
        const userRole = user.app_metadata?.role || user.user_metadata?.role;
        const authResult = await fetchSessionAndCheckAccess(supabase, sessionId, user.id, userRole);
        if (authResult.error) return { error: authResult.error };

        const { error: dbError } = await supabase
            .from('study_sessions')
            .delete()
            .eq('id', sessionId);

        if (dbError) return { error: dbError.message };

        revalidatePath('/teacher/schedule');
        return { success: true };
    } catch (e: unknown) {
        return { error: handleError(e) };
    }
}

// Geçmiş onaylı etüt oturumları (tamamlanmadı/gelmedi kontrol için)
export async function getPendingPastSessions() {
    try {
        const { user, error } = await getAuthContext();
        if (error || !user) return { error: error || 'Oturum bulunamadı' };

        const now = new Date().toISOString();

        // Admin client — RLS bypass gerekli
        const { data: sessions, error: dbError } = await supabaseAdmin
            .from('study_sessions')
            .select(`
                *,
                study_session_statuses!inner ( name ),
                profiles:student_id (
                    full_name,
                    phone,
                    title
                )
            `)
            .eq('teacher_id', user.id)
            .eq('study_session_statuses.name', 'approved')
            .lt('scheduled_at', now)
            .order('scheduled_at', { ascending: true });

        if (dbError) {
            return { error: 'Veri çekilemedi' };
        }

        return { data: sessions || [] };
    } catch (e: unknown) {
        return { error: handleError(e) };
    }
}

// Çakışma kontrolü helper
async function checkAvailabilityConflicts(
    supabase: SupabaseClient,
    userId: string,
    dateString: string,
    startDateTime: Date,
    endDateTime: Date
) {
    // Haftalık ders programı çakışması kontrolü
    const dayOfWeek = startDateTime.getDay() || 7;

    const { data: classes, error: scheduleError } = await supabase
        .from('schedule')
        .select('start_time, end_time, courses(name)')
        .eq('teacher_id', userId)
        .eq('day_of_week', dayOfWeek);

    if (scheduleError) {
        return { error: 'Ders programı kontrol edilirken hata oluştu.' };
    }

    // Ders çakışma kontrolü
    for (const cls of classes || []) {
        const classStart = new Date(`${dateString}T${cls.start_time}+03:00`);
        const classEnd = new Date(`${dateString}T${cls.end_time}+03:00`);

        if (startDateTime < classEnd && endDateTime > classStart) {
            const courseData = (cls as any).courses;
            return { error: `Bu saatte dersiniz var: ${courseData?.name || 'Ders'}` };
        }
    }

    // Mevcut etüt oturumu çakışma kontrolü
    const dayStart = new Date(`${dateString}T00:00:00+03:00`).toISOString();
    const dayEnd = new Date(`${dateString}T23:59:59+03:00`).toISOString();

    const { data: existingSessions, error: sessionError } = await supabase
        .from('study_sessions')
        .select('scheduled_at, end_time, study_session_statuses!inner(name)')
        .eq('teacher_id', userId)
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)
        .neq('study_session_statuses.name', 'cancelled');

    if (sessionError) {
        return { error: 'Mevcut etütler kontrol edilirken hata oluştu.' };
    }

    for (const session of existingSessions || []) {
        const sessionStart = new Date(session.scheduled_at);
        // Eğer end_time null/undefined gelirse (hata paylı veriler), 1 saat var say. Yeni verilerde end_time olacak.
        const sessionEnd = session.end_time ? new Date(session.end_time) : new Date(sessionStart.getTime() + 60 * 60 * 1000); 

        if (startDateTime < sessionEnd && endDateTime > sessionStart) {
            return { error: 'Bu saat aralığında zaten bir etüt veya müsaitlik var.' };
        }
    }

    return { success: true };
}

// Hata yönetimi helper kaldırıldı -> lib/utils/error.ts kullanılıyor

// Öğretmen tarafından etüt atama (Assign Student to Session)
export async function assignStudentToSession(sessionId: string, studentId: string, topic?: string) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { error: error || "Unauthorized" };

    try {
        const { data: session, error: sessionError } = await supabase
            .from('study_sessions')
            .select('teacher_id')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) return { error: "Oturum bulunamadı." };

        const userRole = user.app_metadata?.role || user.user_metadata?.role;
        const isAdmin = userRole === 'admin' || userRole === 'super_admin';

        if (!isAdmin && session.teacher_id !== user.id) {
            return { error: "Bu işlemi sadece ilgili öğretmen veya yönetici yapabilir." };
        }

        const approvedId = await getStatusId(supabaseAdmin, 'approved');
        
        const { error: dbError } = await supabase
            .from('study_sessions')
            .update({ 
                student_id: studentId,
                status_id: approvedId,
                topic: topic || 'Öğretmen Ataması'
            })
            .eq('id', sessionId);

        if (dbError) throw dbError;

        // Öğrenciye bildirim gönder
        await createNotification({
            userId: studentId,
            title: 'Yeni Etüt Ataması 📚',
            message: 'Öğretmeniniz size yeni bir etüt atadı. Takviminizden detayları kontrol edebilirsiniz.',
            type: 'info',
        });
        
    } catch (e: unknown) {
        return { error: handleError(e) };
    }

    revalidatePath('/teacher/schedule');
    revalidatePath('/teacher/dashboard');
    return { success: true };
}
