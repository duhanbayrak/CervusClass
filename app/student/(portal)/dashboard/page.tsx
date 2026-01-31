import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Calendar as CalendarIcon, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { redirect } from 'next/navigation';

async function getStudentData(userId: string) {
    const cookieStore = await cookies();

    // Server-side auth client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // Middleware handles writing cookies
                }
            }
        }
    );

    // 1. Get Profile & Organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, classes(name)')
        .eq('id', userId)
        .single();

    if (!profile) return null;

    // 2. Get Today's Schedule
    const today = new Date();
    // JS getDay() 0=Sunday. Postgres often uses 1=Monday...7=Sunday or 0=Sunday. 
    // Assuming our schema uses 1=Monday, 7=Sunday.
    let todayDow = today.getDay();
    if (todayDow === 0) todayDow = 7;

    // Note: Creating a map for Turkish day names if needed, but we rely on DB query for day_of_week int
    const { data: schedule } = await supabase
        .from('schedule')
        .select(`
            *,
            teacher:profiles!teacher_id(full_name)
        `)
        .eq('class_id', profile.class_id)
        .eq('day_of_week', todayDow)
        .order('start_time', { ascending: true });

    // 3. Get Upcoming Assignments (Homework)
    const { data: homework } = await supabase
        .from('homework')
        .select(`
            *,
            teacher:profiles!teacher_id(full_name)
        `)
        .eq('class_id', profile.class_id)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

    // 4. Get Recent Exam Results
    const { data: exams } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', userId)
        .order('exam_date', { ascending: false })
        .limit(3);

    // 5. Get Study Session Requests
    const { data: etuts } = await supabase
        .from('study_sessions')
        .select(`
            *,
            teacher:profiles!teacher_id(full_name)
        `)
        .eq('student_id', userId)
        .neq('status', 'completed')
        .order('scheduled_at', { ascending: true });

    return {
        profile,
        schedule: schedule || [],
        homework: homework || [],
        exams: exams || [],
        etuts: etuts || []
    };
}

export default async function StudentDashboardPage() {
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

    if (!user) {
        redirect('/student/login');
    }

    const data = await getStudentData(user.id);

    if (!data) return <div>Öğrenci verileri yükleniyor...</div>;

    const { profile, schedule, homework, exams, etuts } = data;

    // Helper for date formatting in Turkish
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* LEFT COLUMN */}
            <div className="md:col-span-2 space-y-6">

                {/* 1. Statistics / Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Average Net Card */}
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp size={100} />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-100">Ortalama Net</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {exams.length > 0
                                    ? (exams.reduce((acc, curr) => acc + (curr.total_net || 0), 0) / exams.length).toFixed(2)
                                    : '-'
                                }
                            </div>
                            <p className="text-xs text-blue-100 mt-1">Son {exams.length} sınav baz alındı</p>
                        </CardContent>
                    </Card>

                    {/* Pending Homework Card */}
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Bekleyen Ödevler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{homework.length}</div>
                            <p className="text-xs text-slate-500 mt-1">Yaklaşan teslim tarihli</p>
                        </CardContent>
                    </Card>

                    {/* Study Requests Card */}
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Etüt Talepleri</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{etuts.filter(e => e.status === 'pending').length}</div>
                            <p className="text-xs text-slate-500 mt-1">Onay bekleyen</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Today's Schedule */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm h-[320px] flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold">Bugünün Ders Programı</CardTitle>
                                <CardDescription>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}</CardDescription>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full pr-4">
                            {schedule.length > 0 ? (
                                <div className="space-y-4">
                                    {schedule.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-300 font-medium text-xs">
                                                <span>{item.start_time.substring(0, 5)}</span>
                                                <span className="text-[10px] text-slate-400">-</span>
                                                <span>{item.end_time.substring(0, 5)}</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 dark:text-white">{item.course_name}</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    {item.teacher?.full_name || 'Eğitmen'}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                                Sınıf {profile.classes?.name}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                                    <Clock className="w-10 h-10 mb-2 opacity-50" />
                                    <p>Bugün için planlanmış ders yok.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* 3. Recent Exam Results */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold">Son Sınav Sonuçları</CardTitle>
                                <CardDescription>Katıldığınız son deneme sınavları</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {exams.map((exam) => (
                                <div key={exam.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{exam.exam_name}</h4>
                                            <p className="text-xs text-slate-500">{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-black text-slate-900 dark:text-white">{exam.total_net}</span>
                                        <span className="text-xs text-slate-500 font-medium">NET</span>
                                    </div>
                                </div>
                            ))}
                            {exams.length === 0 && (
                                <p className="text-slate-500 text-center py-4">Henüz sınav sonucu bulunmuyor.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">

                {/* 1. Pending Homework */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm h-full max-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-500" />
                            Ödevler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {homework.map((hw) => (
                                    <div key={hw.id} className="p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary" className="bg-white text-indigo-600 hover:bg-white border-indigo-200 shadow-sm text-[10px]">
                                                {new Date(hw.due_date).toLocaleDateString('tr-TR')}
                                            </Badge>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Fizik</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                            {hw.description}
                                        </p>
                                        <div className="mt-2 flex items-center justify-end">
                                            <span className="text-xs text-slate-400 italic">{hw.teacher?.full_name}</span>
                                        </div>
                                    </div>
                                ))}
                                {homework.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-2">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Her şey yolunda!</p>
                                        <p className="text-xs text-slate-400">Bekleyen ödeviniz yok.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* 2. Study Session Requests */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            Etüt Talepleri
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {etuts.map((etut) => (
                                <div key={etut.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className={`w-2 h-full min-h-[40px] rounded-full ${etut.status === 'pending' ? 'bg-yellow-400' :
                                            etut.status === 'approved' ? 'bg-green-500' :
                                                etut.status === 'rejected' ? 'bg-red-500' : 'bg-slate-300'
                                        }`}></div>
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">{etut.topic}</h5>
                                        <p className="text-xs text-slate-500">
                                            {etut.teacher?.full_name} • {new Date(etut.scheduled_at).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className={`capitalize text-[10px] ${etut.status === 'pending' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                                            etut.status === 'approved' ? 'text-green-600 border-green-200 bg-green-50' :
                                                'text-slate-500'
                                        }`}>
                                        {etut.status === 'pending' ? 'Bekliyor' : etut.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                                    </Badge>
                                </div>
                            ))}
                            {etuts.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">Aktif etüt talebi yok.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
