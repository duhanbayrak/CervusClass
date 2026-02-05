import { createClient } from '@/lib/supabase-server'
import { ScheduleUploader } from '@/components/schedule/ScheduleUploader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ManualSchedulerDialog } from '@/components/schedule/manual-scheduler-dialog'
import { AdminScheduleView } from '@/components/schedule/admin-schedule-view'
import { ScheduleActions } from '@/components/schedule/schedule-actions'

export default async function AdminSchedulePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Giriş yapınız.</div>

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    if (!profile) return <div>Profil bulunamadı.</div>

    // Fetch Schedule Events
    const { data: events } = await supabase
        .from('schedule')
        .select(`
      *,
      courses ( name, code ),
      classes ( name ),
      profiles ( full_name )
    `)
        .eq('organization_id', profile.organization_id)

    // Fetch Data for Manual Entry Form
    // 2. Teachers
    // Need branch_id for robust filtering
    const { data: teacherRole } = await supabase.from('roles').select('id').eq('name', 'teacher').single();
    let teachers: any[] = [];
    if (teacherRole) {
        const { data } = await supabase.from('profiles').select('id, full_name, branch_id, branches(name)').eq('role_id', teacherRole.id).order('full_name');
        teachers = data || [];
    }
    const teacherOptions = teachers.map(t => ({
        id: t.id,
        label: t.full_name || 'İsimsiz',
        branchName: t.branches?.name,
        branchId: t.branch_id
    }));

    // 3. Courses
    // Need branch_id here too
    const { data: courses } = await supabase.from('courses').select('id, name, branch_id').eq('organization_id', profile.organization_id).order('name');
    const courseOptions = courses?.map(c => ({
        id: c.id,
        label: c.name,
        branchId: c.branch_id
    })) || [];

    // 3. Classes
    const { data: classes } = await supabase.from('classes').select('id, name').eq('organization_id', profile.organization_id).order('name');
    const classOptions = classes?.map(c => ({ id: c.id, label: c.name })) || [];


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Ders Programı Yönetimi</h1>

            <div className="grid gap-6 md:grid-cols-4">
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>İşlemler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ScheduleUploader />
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">veya</span>
                                </div>
                            </div>
                            <ManualSchedulerDialog
                                teachers={teacherOptions}
                                courses={courseOptions}
                                classes={classOptions}
                            />
                            <div className="pt-4 border-t">
                                <ScheduleActions />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-3 h-[900px]">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Haftalık Program</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[800px] p-0">
                            <AdminScheduleView
                                events={(events as any) || []}
                                teachers={teacherOptions}
                                courses={courseOptions}
                                classes={classOptions}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
