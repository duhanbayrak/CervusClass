import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, ClipboardList, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

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

    // Calculate the actual date for the selected day of the week (in the current week)
    const now = new Date();
    const currentDayJS = now.getDay(); // 0=Sun, 1=Mon...6=Sat
    const currentDayISO = currentDayJS === 0 ? 7 : currentDayJS; // 1=Mon...7=Sun

    const dayDifference = dayOfWeek - currentDayISO;
    const targetDateObj = new Date(now);
    targetDateObj.setDate(now.getDate() + dayDifference);
    const targetDate = format(targetDateObj, 'yyyy-MM-dd');

    // 1. Fetch Basic Schedule
    const { data: schedules, error } = await supabase
        .from('schedule')
        .select(`
            *,
            classes (name),
            courses (name)
        `)
        .eq('teacher_id', user.id)
        .eq('day_of_week', dayOfWeek)
        .order('start_time');

    if (error || !schedules || schedules.length === 0) {
        return [];
    }

    // 2. Fetch Attendance ONLY for this day and these schedules
    const scheduleIds = schedules.map(s => s.id);
    const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select('id, schedule_id')
        .eq('date', targetDate)
        .in('schedule_id', scheduleIds);

    // 3. Merge Data
    const attendanceMap = new Map(attendanceRecords?.map(a => [a.schedule_id, a.id]));

    const processedSchedules = schedules.map(item => {
        const attendanceId = attendanceMap.get(item.id);
        return {
            ...item,
            isAttendanceTaken: !!attendanceId,
            attendanceId: attendanceId
        };
    });

    return processedSchedules;
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
                                    <Button
                                        className={item.isAttendanceTaken
                                            ? "w-full border-zinc-300 text-zinc-700 hover:bg-zinc-50 group hover:border-zinc-400"
                                            : "w-full bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all text-white group"
                                        }
                                        variant={item.isAttendanceTaken ? "outline" : "default"}
                                    >
                                        {item.isAttendanceTaken ? (
                                            <>
                                                <Eye className="w-4 h-4 mr-2 text-zinc-500 group-hover:text-zinc-700" />
                                                Düzenle / Göster
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardList className="w-4 h-4 mr-2" />
                                                Yoklama Al
                                            </>
                                        )}
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
