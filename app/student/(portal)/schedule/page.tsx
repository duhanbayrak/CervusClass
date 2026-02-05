import { createClient } from '@/lib/supabase-server'
import { WeeklyScheduler } from '@/components/schedule/WeeklyScheduler'
import { Card, CardContent } from '@/components/ui/card'

export default async function StudentSchedulePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Giriş yapınız.</div>

    const { data: profile } = await supabase.from('profiles').select('class_id').eq('id', user.id).single()

    if (!profile || !profile.class_id) return <div>Sınıf bilginiz bulunamadı.</div>

    const { data: events } = await supabase
        .from('schedule')
        .select(`
      *,
      courses ( name, code ),
      classes ( name ),
      profiles ( full_name ) 
    `)
        .eq('class_id', profile.class_id)

    return (
        <div className="space-y-6 h-full">
            <h1 className="text-3xl font-bold tracking-tight">Sınıf Ders Programı</h1>

            <div className="h-[850px]">
                <Card className="h-full">
                    <CardContent className="h-full p-2">
                        <WeeklyScheduler
                            events={(events as any) || []}
                            role="student"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
