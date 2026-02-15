import { ScheduleUploader } from '@/components/schedule/ScheduleUploader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ManualSchedulerDialog } from '@/components/schedule/manual-scheduler-dialog'
import { AdminScheduleView } from '@/components/schedule/admin-schedule-view'
import { ScheduleActions } from '@/components/schedule/schedule-actions'
import { getAuthContext } from '@/lib/auth-context'

export default async function AdminSchedulePage() {
    // Merkezi auth context — tek client + user + organizationId
    const { supabase, user, organizationId } = await getAuthContext()
    if (!user) return <div>Giriş yapınız.</div>
    if (!organizationId) return <div>Kurum bilgisi bulunamadı.</div>

    // Paralel veri çekme
    const [eventsResult, teacherRoleResult, coursesResult, classesResult] = await Promise.all([
        // Program etkinlikleri
        supabase
            .from('schedule')
            .select(`
                *,
                courses ( name, code ),
                classes ( name ),
                profiles ( full_name )
            `)
            .eq('organization_id', organizationId),

        // Öğretmen rol ID'si
        supabase.from('roles').select('id').eq('name', 'teacher').single(),

        // Dersler
        supabase.from('courses').select('id, name, branch_id').eq('organization_id', organizationId).order('name'),

        // Sınıflar
        supabase.from('classes').select('id, name').eq('organization_id', organizationId).order('name')
    ]);

    // Öğretmen listesi (rol ID bağımlı — sıralı sorgu)
    let teachers: any[] = [];
    if (teacherRoleResult.data) {
        const { data } = await supabase.from('profiles').select('id, full_name, branch_id, branches(name)').eq('role_id', teacherRoleResult.data.id).order('full_name');
        teachers = data || [];
    }

    const teacherOptions = teachers.map(t => ({
        id: t.id,
        label: t.full_name || 'İsimsiz',
        branchName: t.branches?.name,
        branchId: t.branch_id || undefined
    }));

    const courseOptions = coursesResult.data?.map(c => ({
        id: c.id,
        label: c.name,
        branchId: c.branch_id || undefined
    })) || [];

    const classOptions = classesResult.data?.map(c => ({ id: c.id, label: c.name })) || [];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Ders Programı Yönetimi</h1>

            <div className="flex flex-col md:grid md:grid-cols-4 gap-6 h-full">
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>İşlemler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <ScheduleUploader />
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">veya</span>
                                    </div>
                                </div>
                            </div>
                            <ManualSchedulerDialog
                                teachers={teacherOptions}
                                courses={courseOptions}
                                classes={classOptions}
                            />
                            <div className="pt-4 border-t hidden md:block">
                                <ScheduleActions />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-3 h-[600px] md:h-[900px]">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex-none">
                            <CardTitle>Haftalık Program</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
                            <AdminScheduleView
                                events={(eventsResult.data as any) || []}
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
