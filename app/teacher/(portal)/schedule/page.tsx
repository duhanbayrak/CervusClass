import { createClient } from '@/lib/supabase-server'
import { WeeklyScheduler } from '@/components/schedule/WeeklyScheduler'
import { Card, CardContent } from '@/components/ui/card'

export default async function TeacherSchedulePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Giriş yapınız.</div>

    console.log("Teacher Schedule Debug - User ID:", user.id);
    console.log("Teacher Schedule Debug - Metadata:", JSON.stringify(user.app_metadata, null, 2));

    const { data: events } = await supabase
        .from('schedule')
        .select(`
      *,
      courses ( name, code ),
      classes ( name ),
      profiles ( full_name )
    `)
        .eq('teacher_id', user.id)

    return (
        <div className="space-y-6 h-full">
            <h1 className="text-3xl font-bold tracking-tight">Haftalık Ders Programım</h1>

            <div className="h-[850px]">
                <Card className="h-full">
                    <CardContent className="h-full p-2">
                        <WeeklyScheduler
                            events={(events as any) || []}
                            role="teacher"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
