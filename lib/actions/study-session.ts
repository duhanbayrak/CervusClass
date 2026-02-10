'use server'

import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { type SupabaseClient } from '@supabase/supabase-js'

async function getStatusId(supabase: SupabaseClient, name: string) {
    const { data } = await supabase.from('study_session_statuses').select('id').eq('name', name).single();
    return data?.id;
}

export async function getTeachers() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Oturum bulunamadı (User null)' }

        // Debug Env Vars
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return { error: 'CRITICAL: Service Role Key missing in server environment' }
        }

        // Get user's organization explicitly
        const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        if (profileError || !profile?.organization_id) {
            return { error: `Profil/Organizasyon hatası: ${profileError?.message || 'OrgId yok'} (User: ${user.id})` }
        }

        // Determine target Role ID (Teacher)
        const { data: role, error: roleError } = await supabaseAdmin.from('roles').select('id, name').eq('name', 'teacher').single()

        if (roleError || !role) {
            return { error: `Rol bulma hatası: ${roleError?.message} (Aranan: 'teacher')` }
        }

        // Fetch teachers using Admin client
        const { data: teachers, error: teachersError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name') // Removed branch as it doesn't exist on profiles
            .eq('role_id', role.id)
            .eq('organization_id', profile.organization_id)
            .order('full_name')

        if (teachersError) {
            return { error: `Öğretmen sorgu hatası: ${teachersError.message}` }
        }

        if (!teachers || teachers.length === 0) {
            return { error: `Sorgu başarılı ama 0 öğretmen döndü. (Org: ${profile.organization_id}, Role: ${role.id})` }
        }

        return { data: teachers }
    } catch (err: unknown) {
        return { error: `Beklenmedik Server Hatası: ${handleError(err)}` }
    }
}

export async function getTeacherSchedule(teacherId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { schedule: [], sessions: [], teacherName: '', error: 'User not found' }

        // Verify user's organization to prevent cross-org data access
        const { data: userProfile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        if (!userProfile?.organization_id) return { schedule: [], sessions: [], teacherName: '', error: 'Org not found' }

        // Fetch data using Admin client
        // 1. Fixed Schedule (Classes) - REMOVED for Students
        const schedule: any[] = []

        // 2. Get Teacher's Available/Pending Sessions
        const normalSessionsQuery = supabaseAdmin
            .from('study_sessions')
            .select('*, study_session_statuses(name)')
            .eq('teacher_id', teacherId)
            .eq('organization_id', userProfile.organization_id)
            .gt('scheduled_at', new Date().toISOString());

        const { data: rawSessions, error: sessionError } = await normalSessionsQuery;

        if (sessionError) {
            return { schedule: [], sessions: [], teacherName: '', error: sessionError.message }
        }

        // Helper to get status name safely
        const getStatus = (s: any) => s.study_session_statuses?.name;

        // Sanitize sessions: Hide private info for slots booked by others
        const sessions = rawSessions?.filter(s => getStatus(s) !== 'cancelled').map(session => {
            const status = getStatus(session);
            const isMySession = session.student_id === user.id
            const isAvailable = status === 'available'

            // Inject status string for frontend compatibility
            const sessionWithStatus = { ...session, status };

            if (isAvailable || isMySession) {
                return sessionWithStatus
            } else {
                // Mask details for others' bookings
                return {
                    ...sessionWithStatus,
                    topic: 'Dolu', // Mask topic
                    student_id: null // Mask student ID
                }
            }
        })

        // 3. Get Teacher Info
        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', teacherId).single()

        return {
            schedule: [], // Always empty for student view
            sessions: sessions || [],
            teacherName: profile?.full_name
        }
    } catch (e: unknown) {
        return { schedule: [], sessions: [], teacherName: '', error: handleError(e) }
    }
}

export async function createAvailability(date: string, startTime: string, endTime: string) {
    console.log('>>> createAvailability CALLED', { date, startTime, endTime });
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get current user's organization_id
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profile not found' }

    // 1. Calculate Timestamps considering Timezone (Assume Turkey Time +03:00)
    const startDateTime = new Date(`${date}T${startTime}:00+03:00`)
    const endDateTime = new Date(`${date}T${endTime}:00+03:00`)

    if (startDateTime < new Date()) {
        return { error: 'Geçmiş bir tarihe etüt ekleyemezsiniz.' }
    }

    if (endDateTime <= startDateTime) {
        return { error: 'Bitiş saati başlangıç saatinden sonra olmalıdır.' }
    }

    // 2. & 3. Check for conflicts (Classes & Existing Sessions) via helper
    const conflictResult = await checkAvailabilityConflicts(supabase, user.id, date, startDateTime, endDateTime);
    if (conflictResult.error) {
        return { error: conflictResult.error };
    }

    try {
        const availableId = await getStatusId(supabase, 'available');
        // 4. Insert if no conflicts
        const { error } = await supabase.from('study_sessions').insert({
            teacher_id: user.id,
            organization_id: profile.organization_id,
            student_id: null,
            status_id: availableId,
            scheduled_at: startDateTime.toISOString(),
            topic: ''
        })

        if (error) throw error;
    } catch (e: unknown) {
        return { error: handleError(e) || 'Kayıt hatası' }
    }



    revalidatePath('/teacher/schedule')
    revalidatePath('/teacher/study-requests')
    revalidatePath('/teacher/dashboard')
    revalidatePath('/student/study-requests')
    return { success: true }
}

export async function requestSession(sessionId: string, topic: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    try {
        const pendingId = await getStatusId(supabase, 'pending');
        const availableId = await getStatusId(supabase, 'available');

        const { error } = await supabase
            .from('study_sessions')
            .update({
                student_id: user.id,
                status_id: pendingId,
                topic: topic
            })
            .eq('id', sessionId)
            .eq('status_id', availableId) // Optimistic locking

        if (error) throw error;
    } catch (e: unknown) {
        return { error: handleError(e) }
    }



    revalidatePath('/student/study-requests')
    revalidatePath('/teacher/study-requests')
    revalidatePath('/teacher/dashboard')
    revalidatePath('/teacher/schedule')
    return { success: true }
}

export async function approveSession(sessionId: string) {
    const supabase = await createClient()

    // RLS ensures only the teacher owner can update
    try {
        const approvedId = await getStatusId(supabase, 'approved');
        const { error } = await supabase
            .from('study_sessions')
            .update({ status_id: approvedId })
            .eq('id', sessionId)

        if (error) throw error;
    } catch (e: unknown) {
        return { error: handleError(e) }
    }



    revalidatePath('/teacher/schedule')
    return { success: true }
}

export async function rejectSession(sessionId: string, reason?: string) {
    const supabase = await createClient()

    try {
        const rejectedId = await getStatusId(supabase, 'rejected');

        const { error } = await supabase
            .from('study_sessions')
            .update({
                status_id: rejectedId,
                rejection_reason: reason
            })
            .eq('id', sessionId)

        if (error) throw error;
    } catch (e: unknown) {
        console.error('Reject Error:', e);
        return { error: handleError(e) }
    }

    revalidatePath('/teacher/study-requests')
    revalidatePath('/teacher/dashboard')
    revalidatePath('/teacher/schedule')
    return { success: true }
}

export async function cancelSession(sessionId: string) {
    const supabase = await createClient()

    // Teacher can delete/cancel.
    const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId)

    if (error) return { error: error.message }

    revalidatePath('/teacher/schedule')
    return { success: true }
}

export async function getPendingPastSessions() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: 'Oturum bulunamadı' }

        const now = new Date().toISOString()

        // Use Admin client to bypass RLS for this specific check, ensuring we only fetch for the logged-in teacher
        const { data: sessions, error } = await supabaseAdmin
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
            .order('scheduled_at', { ascending: true })

        if (error) {
            return { error: 'Veri çekilemedi' }
        }

        return { data: sessions || [] }
    } catch (e: unknown) {
        return { error: handleError(e) }
    }
}



async function checkAvailabilityConflicts(
    supabase: SupabaseClient,
    userId: string,
    dateString: string,
    startDateTime: Date,
    endDateTime: Date
) {
    // 2. Check for conflicts with Weekly Schedule (Classes)
    const dayOfWeek = startDateTime.getDay() || 7;

    const { data: classes, error: scheduleError } = await supabase
        .from('schedule')
        .select('start_time, end_time, courses(name)')
        .eq('teacher_id', userId)
        .eq('day_of_week', dayOfWeek)

    if (scheduleError) {
        return { error: 'Ders programı kontrol edilirken hata oluştu.' }
    }

    // Check overlap with classes
    for (const cls of classes || []) {
        // Construct TRT dates for class times
        const classStart = new Date(`${dateString}T${cls.start_time}+03:00`)
        const classEnd = new Date(`${dateString}T${cls.end_time}+03:00`)

        if (startDateTime < classEnd && endDateTime > classStart) {
            const courseName = (cls as any).courses?.name || 'Ders';
            return { error: `Bu saatte dersiniz var: ${courseName}` }
        }
    }

    // 3. Check for conflicts with existing Study Sessions
    const dayStart = new Date(`${dateString}T00:00:00+03:00`).toISOString()
    const dayEnd = new Date(`${dateString}T23:59:59+03:00`).toISOString()

    const { data: existingSessions, error: sessionError } = await supabase
        .from('study_sessions')
        .select('scheduled_at, study_session_statuses!inner(name)')
        .eq('teacher_id', userId)
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)
        .neq('study_session_statuses.name', 'cancelled')

    if (sessionError) {
        return { error: 'Mevcut etütler kontrol edilirken hata oluştu.' }
    }

    for (const session of existingSessions || []) {
        const sessionStart = new Date(session.scheduled_at)
        const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000) // Assume 1 hour

        // Correct check: new start < existing end AND new end > existing start
        if (startDateTime < sessionEnd && endDateTime > sessionStart) {
            return { error: 'Bu saat aralığında zaten bir etüt veya müsaitlik var.' }
        }
    }

    return { success: true };
}

function handleError(e: unknown): string {
    return e instanceof Error ? e.message : 'Bilinmeyen hata';
}
