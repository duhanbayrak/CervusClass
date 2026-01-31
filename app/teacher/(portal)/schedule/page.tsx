import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

async function getTeacherSchedule() {
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
    if (!user) return [];

    const { data: schedule } = await supabase
        .from('schedule')
        .select(`
            *,
            classes(name)
        `)
        .eq('teacher_id', user.id)
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

export default async function TeacherSchedulePage() {
    const schedule = await getTeacherSchedule();

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
                    <p className="text-slate-500 dark:text-slate-400">Haftalık ders yükü ve saatleri</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map((dayCode) => (
                    <Card key={dayCode} className={`flex flex-col h-full border-slate-200 dark:border-slate-700 shadow-sm ${new Date().getDay() === dayCode ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                        }`}>
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-3">
                            <CardTitle className="text-center font-bold text-slate-700 dark:text-slate-200">
                                {DAYS_TR[dayCode as keyof typeof DAYS_TR]}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex-1">
                            {scheduleByDay[dayCode]?.length > 0 ? (
                                <div className="space-y-3">
                                    {scheduleByDay[dayCode].map((lesson) => (
                                        <div key={lesson.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                                                    {lesson.classes?.name}
                                                </Badge>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{lesson.course_name}</h4>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic py-8">
                                    Boş
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
