import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AttendanceForm from '@/components/dashboard/teacher/attendance-form';

async function getScheduleWithStudents(scheduleId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Get Schedule Details
    const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .select(`
            *,
            classes (
                id,
                name
            ),
            courses (
                name
            )
        `)
        .eq('id', scheduleId)
        .eq('teacher_id', user.id)
        .single();

    if (scheduleError || !schedule) {
        return { schedule: null, students: [], existingAttendance: [], date: '' };
    }

    // 2. Get Students in that class
    const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            avatar_url,
            roles!inner (name)
        `)
        .eq('class_id', schedule.class_id)
        .eq('roles.name', 'student')
        .order('full_name');

    if (studentsError) {
    }

    // 3. Calculate Target Date based on Schedule Day of Week
    // This ensures that even if teacher takes attendance on Wednesday for a Monday class,
    // the date is recorded as Monday.
    const now = new Date();
    const currentDayISO = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
    const targetDayISO = schedule.day_of_week; // 1 - 7

    // Calculate difference in days to find the target date within the CURRENT week
    const dayDiff = targetDayISO - currentDayISO;
    const targetDateObj = new Date(now);
    targetDateObj.setDate(now.getDate() + dayDiff);
    const targetDateStr = targetDateObj.toISOString().split('T')[0];

    // Get existing attendance for the TARGET date
    const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('date', targetDateStr);

    return {
        schedule,
        students: students || [],
        existingAttendance: existingAttendance || [],
        date: targetDateStr // Renamed from today to date
    };
}

export default async function TakeAttendancePage({ params }: { params: any }) {
    const resolvedParams = await Promise.resolve(params);
    const scheduleId = resolvedParams.scheduleId;

    const data = await getScheduleWithStudents(scheduleId);

    if (!data) {
        redirect('/teacher/login');
    }

    if (!data.schedule) {
        notFound();
    }

    const { schedule, students, existingAttendance, date } = data;

    // Create a map of existing attendance for easy lookup
    const attendanceMap: Record<string, { status: string; late_minutes: number; id: string }> = {};
    existingAttendance.forEach((att: any) => {
        attendanceMap[att.student_id] = {
            status: att.status,
            late_minutes: att.late_minutes || 0,
            id: att.id
        };
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Link href="/teacher/attendance">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {schedule.courses?.name || 'Ders'} - Yoklama
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                            {schedule.classes?.name}
                        </Badge>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {students.length} öğrenci
                        </span>
                    </p>
                </div>
            </div>

            {/* Attendance Form (Client Component) */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle>Öğrenci Listesi</CardTitle>
                    <CardDescription>
                        {date && new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })} tarihli yoklama. Durumu seçip kaydedin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {students.length > 0 ? (
                        <AttendanceForm
                            scheduleId={scheduleId}
                            classId={schedule.class_id}
                            students={students}
                            attendanceMap={attendanceMap}
                            date={date!}
                        />
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Bu sınıfta kayıtlı öğrenci bulunmamaktadır.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
