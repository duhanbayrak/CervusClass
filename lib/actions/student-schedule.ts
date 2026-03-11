'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthContext } from '@/lib/auth-context'
import { handleError } from '@/lib/utils/error'


export async function getStudentClasses() {
    try {
        const { user, organizationId, error } = await getAuthContext();
        if (error || !user || !organizationId) return { schedule: [], error: error || 'User not found' };

        // 1. Get the student's profile to find their class_id
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('class_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.class_id) {
            return { schedule: [], error: 'Sınıf bilginiz bulunamadı.' };
        }

        // 2. Fetch the class schedule
        const { data: schedule, error: scheduleError } = await supabaseAdmin
            .from('schedule')
            .select('*, courses(name), classes(name), profiles(full_name)')
            .eq('class_id', profile.class_id)
            .eq('organization_id', organizationId);

        if (scheduleError) {
            return { schedule: [], error: 'Ders programı alınamadı: ' + scheduleError.message };
        }

        // Format to internal ScheduleEvent
        const formattedSchedule = schedule?.map(item => ({
            ...item,
            start_time: item.start_time,
            end_time: item.end_time,
            day_of_week: item.day_of_week,
        })) || [];

        return {
            schedule: formattedSchedule as any[], // type cast to avoid deep nested type issues in next.js boundaries
        };
    } catch (e: unknown) {
        return { schedule: [], error: handleError(e) };
    }
}
