
import { SupabaseClient } from '@supabase/supabase-js';

export async function getStudentProfileData(supabase: SupabaseClient, id: string) {
    // 1. Get Profile & Class
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
            *,
            classes(name),
            roles!inner(name)
        `)
        .eq('id', id)
        .eq('roles.name', 'student')
        .single();

    if (error || !profile) return null;

    // 2. Get Exam Results
    const { data: examResults } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', id)
        .order('exam_date', { ascending: false });

    // 3. Get Homework Statistics
    // Uses 'head: true' and 'count: exact' for efficient counting
    const { count: approvedCount } = await supabase
        .from('homework_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', id)
        .eq('status', 'approved');

    const { count: rejectedCount } = await supabase
        .from('homework_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', id)
        .eq('status', 'rejected');

    const { count: pendingCount } = await supabase
        .from('homework_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', id)
        .eq('status', 'pending');

    // 4. Get Class Attendance Stats
    const { data: classAttendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', id);

    const classStats = {
        total: classAttendance?.length || 0,
        present: classAttendance?.filter(a => a.status === 'present').length || 0,
        late: classAttendance?.filter(a => a.status === 'late').length || 0,
        absent: classAttendance?.filter(a => a.status === 'absent').length || 0,
        excused: classAttendance?.filter(a => a.status === 'excused').length || 0,
    };

    // Calculate Class Attendance Rate (Present + Late) / (Total - Excused)
    // Or simplified: (Present + Late) / Total
    const classTotalForRate = classStats.total - classStats.excused;
    const classRate = classTotalForRate > 0
        ? Math.round(((classStats.present + classStats.late) / classTotalForRate) * 100)
        : 100;

    // 5. Get Study Session Attendance Stats
    // We need to join with status to filter by name
    const { data: studySessions } = await supabase
        .from('study_sessions')
        .select(`
            id,
            study_session_statuses!inner(name)
        `)
        .eq('student_id', id);

    const studyStats = {
        total: 0,
        attended: 0,
        missed: 0,
        rate: 100
    };

    if (studySessions) {
        // We only count sessions that are 'completed' (attended) or 'no_show' (missed)
        // 'scheduled', 'pending', 'approved' are future/current, not past attendance.
        const completed = studySessions.filter((s: any) => s.study_session_statuses?.name === 'completed').length;
        const noShow = studySessions.filter((s: any) => s.study_session_statuses?.name === 'no_show').length;

        studyStats.attended = completed;
        studyStats.missed = noShow;
        studyStats.total = completed + noShow;
        studyStats.rate = studyStats.total > 0
            ? Math.round((completed / studyStats.total) * 100)
            : 100;
    }

    return {
        profile,
        examResults: examResults || [],
        stats: {
            homework: {
                approved: approvedCount || 0,
                rejected: rejectedCount || 0,
                pending: pendingCount || 0,
                total: (approvedCount || 0) + (rejectedCount || 0) + (pendingCount || 0)
            },
            attendance: {
                class: { ...classStats, rate: classRate },
                study: { ...studyStats }
            },
            averageGrade: 0 // Placeholder
        }
    };
}
