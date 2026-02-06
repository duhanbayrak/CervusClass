import { createClient } from '@/lib/supabase-server'
import { TeacherScheduleClient } from '@/components/schedule/teacher-schedule-client'
import { Card, CardContent } from '@/components/ui/card'

export default async function TeacherSchedulePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Giriş yapınız.</div>

    console.log("Teacher Schedule Debug - User ID:", user.id);
    console.log("Teacher Schedule Debug - Metadata:", JSON.stringify(user.app_metadata, null, 2));

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
                profiles:student_id ( full_name )
            `)
            .eq('teacher_id', user.id)
            .neq('status', 'cancelled') // Assuming we filter cancelled
    ]);

    const events = scheduleResponse.data;
    const studySessions = studySessionsResponse.data;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight shrink-0">Haftalık Ders Programım</h1>

            <div className="flex-1 min-h-0">
                <Card className="h-full flex flex-col">
                    <CardContent className="h-full p-2 flex flex-col">
                        <TeacherScheduleClient
                            events={(events as any) || []}
                            studySessions={(studySessions as any) || []}
                            currentUserId={user.id}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
