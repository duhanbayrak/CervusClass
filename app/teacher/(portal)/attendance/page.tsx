import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';

interface PageProps {
    searchParams: Promise<{
        day?: string;
    }>;
}

// Helper to map JS day index (0=Sun) to DB day_of_week (Assume 1=Mon...7=Sun or matches JS?)
// Let's assume DB uses ISO day of week (1=Mon, 7=Sun). JS is 0=Sun, 1=Mon.
// We'll normalize.
const days = [
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
    { value: 7, label: 'Pazar' },
];

async function getSchedule(dayOfWeek: number) {
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch schedule for the teacher and specific day
    // Also check if attendance exists for this schedule AND today's date
    // Note: Checking specific date 'today' for attendance status. 
    // Since day_of_week is generic, we need to know if attendance was taken "for this specific occurrence".
    // For simplicity, we just check if ANY attendance record exists for this schedule_id and TODAY.

    const today = new Date().toISOString().split('T')[0];

    const { data: schedules, error } = await supabase
        .from('schedule')
        .select(`
            *,
            classes (name),
            courses (name),
            attendance (
                id,
                created_at,
                date
            )
        `)
        .eq('teacher_id', user.id)
        .eq('day_of_week', dayOfWeek)
        .order('start_time');

    if (error) {

        return [];
    }

    const processedSchedules = schedules?.map(item => {
        const todaysAttendance = item.attendance?.find((att: any) => att.date === today);
        return {
            ...item,
            isAttendanceTaken: !!todaysAttendance,
            attendanceId: todaysAttendance?.id
        };
    });

    return processedSchedules || [];
}

export default async function AttendancePage(props: PageProps) {
    const searchParams = await props.searchParams;

    // Default to today if no param, converted to 1-7 range (ISO)
    const todayJS = new Date().getDay(); // 0=Sun, 1=Mon
    const todayISO = todayJS === 0 ? 7 : todayJS;

    const selectedDay = searchParams.day ? parseInt(searchParams.day) : todayISO;
    const items = await getSchedule(selectedDay);

    if (items === null) {
        redirect('/teacher/login');
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Yoklama</h2>
                <p className="text-slate-500 dark:text-slate-400">Günlük ders programı ve yoklama işlemleri.</p>
            </div>

            {/* Day Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((day) => (
                    <Link
                        key={day.value}
                        href={`/teacher/attendance?day=${day.value}`}
                        replace
                    >
                        <Button
                            variant={selectedDay === day.value ? "default" : "outline"}
                            className={selectedDay === day.value ? "bg-[#135bec] hover:bg-blue-700" : ""}
                        >
                            {day.label}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Schedule List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.length > 0 ? (
                    items.map((item: any) => (
                        <Card key={item.id} className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="bg-slate-50 mb-2">
                                        {item.classes?.name || 'Genel'}
                                    </Badge>
                                    {item.isAttendanceTaken ? (
                                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Alındı
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Bekliyor
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                    {item.courses?.name}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Link href={`/teacher/attendance/${item.id}`} className="w-full">
                                    <Button className="w-full" variant={item.isAttendanceTaken ? "outline" : "default"}>
                                        {item.isAttendanceTaken ? "Düzenle / Göster" : "Yoklama Al"}
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Bu gün için planlanmış ders bulunmamaktadır.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
