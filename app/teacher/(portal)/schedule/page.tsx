import { createClient } from '@/lib/supabase-server'
import { TeacherScheduleClient } from '@/components/schedule/teacher-schedule-client'
import { Card, CardContent } from '@/components/ui/card'
import { ScheduleEvent, StudySessionEvent } from '@/components/schedule/WeeklyScheduler'

export default async function TeacherSchedulePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Giriş yapınız.</div>

    // Parallel Fetching
    const [scheduleResponse, studySessionsResponse] = await Promise.all([
        supabase
            .from('schedule')
            .select(`
                *,
                courses ( name, code ),
                classes ( name ),
                profiles ( full_name )
            `)
            .eq('teacher_id', user.id),

        supabase
            .from('study_sessions')
            .select(`
                *,
                profiles:student_id ( full_name ),
                study_session_statuses ( name )
            `)
            .eq('teacher_id', user.id)
    ]);

    // Start of type definition
    type RawSession = Omit<StudySessionEvent, 'status'> & {
        study_session_statuses: { name: string } | null
    };

    const events = (scheduleResponse.data || []) as unknown as ScheduleEvent[];
    const rawSessions = (studySessionsResponse.data || []) as unknown as RawSession[];

    const studySessions: StudySessionEvent[] = rawSessions
        .filter(s => s.study_session_statuses?.name !== 'cancelled')
        .map(s => ({
            ...s,
            status: s.study_session_statuses?.name as StudySessionEvent['status']
        }));

    return (
        <div className="space-y-6 h-full flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight shrink-0">Haftalık Ders Programım</h1>

            <div className="flex-1 min-h-0">
                <Card className="h-full flex flex-col">
                    <CardContent className="h-full p-2 flex flex-col">
                        <TeacherScheduleClient
                            events={events}
                            studySessions={studySessions}
                            currentUserId={user.id}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
