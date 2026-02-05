'use server'

import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

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
    } catch (err: any) {
        return { error: `Beklenmedik Server Hatası: ${err.message}` }
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
        // Debug: Log the query parameters
        console.log(`getTeacherSchedule: Fetching for teacher ${teacherId}, org ${userProfile.organization_id}`)

        const { data: rawSessions, error: sessionError } = await supabaseAdmin
            .from('study_sessions')
            .select('*')
            .eq('teacher_id', teacherId)
            .eq('organization_id', userProfile.organization_id)
            .neq('status', 'cancelled')
            .gt('scheduled_at', new Date().toISOString()) // Future only

        if (sessionError) {
            console.error("getTeacherSchedule Error:", sessionError)
            return { schedule: [], sessions: [], teacherName: '', error: sessionError.message }
        }

        // Sanitize sessions: Hide private info for slots booked by others
        const sessions = rawSessions?.map(session => {
            const isMySession = session.student_id === user.id
            const isAvailable = session.status === 'available'

            if (isAvailable || isMySession) {
                return session
            } else {
                // Mask details for others' bookings
                return {
                    ...session,
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
    } catch (e: any) {
        console.error("getTeacherSchedule Exception:", e)
        return { schedule: [], sessions: [], teacherName: '', error: e.message }
    }
}

export async function createAvailability(date: string, startTime: string, endTime: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get current user's organization_id to be safe (though RLS enforces it, good to include)
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profile not found' }

    // scheduled_at should be a timestamp. We need to combine date and startTime.
    const scheduledAt = new Date(`${date}T${startTime}:00`).toISOString()

    const { error } = await supabase.from('study_sessions').insert({
        teacher_id: user.id,
        organization_id: profile.organization_id,
        student_id: null, // Explicitly null for availability
        status: 'available',
        scheduled_at: scheduledAt,
        topic: 'Müsaitlik' // Default topic or leave empty?
    })

    if (error) {
        console.error('Error creating availability:', error)
        return { error: error.message }
    }

    revalidatePath('/teacher/schedule')
    revalidatePath('/teacher/study-requests')
    revalidatePath('/teacher/dashboard')
    revalidatePath('/student/study-requests') // In case availability update impacts student view
    return { success: true }
}

export async function requestSession(sessionId: string, topic: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('study_sessions')
        .update({
            student_id: user.id,
            status: 'pending',
            topic: topic
        })
        .eq('id', sessionId)
        .eq('status', 'available') // Optimistic locking: ensure it's still available

    if (error) return { error: error.message }

    revalidatePath('/student/study-requests')
    revalidatePath('/teacher/study-requests')
    revalidatePath('/teacher/dashboard')
    revalidatePath('/teacher/schedule')
    return { success: true }
}

export async function approveSession(sessionId: string) {
    const supabase = await createClient()

    // RLS ensures only the teacher owner can update
    const { error } = await supabase
        .from('study_sessions')
        .update({ status: 'approved' })
        .eq('id', sessionId)

    if (error) return { error: error.message }

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
