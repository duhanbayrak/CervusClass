import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

async function getWeeklySchedule(userId: string) {
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

    // Get user's class_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', userId)
        .single();

    if (!profile?.class_id) return [];

    // Get schedule
    const { data: schedule } = await supabase
        .from('schedule')
        .select(`
            *,
            teacher:profiles!teacher_id(full_name)
        `)
        .eq('class_id', profile.class_id)
        .order('day_of_week')
        .order('start_time');

    return schedule || [];
}

const DAYS_TR = {
    1: 'Pazartesi',
    2: 'Salı',
    3: 'Çarşamba',
    4: 'Perşembe',
    5: 'Cuma',
    6: 'Cumartesi',
    7: 'Pazar'
};

export default async function StudentSchedulePage() {
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

    const schedule = await getWeeklySchedule(user.id);

    // Group by day
    const scheduleByDay = (schedule as any[]).reduce((acc, curr) => {
        const day = curr.day_of_week;
        if (!acc[day]) acc[day] = [];
        acc[day].push(curr);
        return acc;
    }, {} as Record<number, any[]>);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ders Programım</h2>
                    <p className="text-slate-500 dark:text-slate-400">Haftalık ders çizelgesi</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <CalendarIcon className="w-5 h-5 text-indigo-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map((dayCode) => (
                    <Card key={dayCode} className={`border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow ${new Date().getDay() === dayCode ? 'border-indigo-500 ring-1 ring-indigo-500/20' : ''
                        }`}>
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <CardTitle className="text-center font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2">
                                {DAYS_TR[dayCode as keyof typeof DAYS_TR]}
                                {new Date().getDay() === dayCode && <Badge variant="default" className="bg-indigo-500 text-[10px] h-5">Bugün</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {scheduleByDay[dayCode]?.length > 0 ? (
                                scheduleByDay[dayCode].map((lesson) => (
                                    <div key={lesson.id} className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm relative group hover:border-indigo-200 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{lesson.course_name}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                            {lesson.teacher?.full_name}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm italic">
                                    Ders yok
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
