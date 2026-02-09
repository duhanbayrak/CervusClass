import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Clock, Calendar as CalendarIcon, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { PendingSessionsCard } from '@/components/dashboard/teacher/pending-sessions-card';
import { PendingHomeworkCard } from '@/components/dashboard/teacher/pending-homework-card';

async function getTeacherData(userId: string) {
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

    // 1. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (!profile) return null;

    // 2. Get Today's Schedule
    const today = new Date();
    let todayDow = today.getDay();
    if (todayDow === 0) todayDow = 7;

    // Find classes where this teacher is assigned in the schedule
    const { data: schedule } = await supabase
        .from('schedule')
        .select(`
            *,
            classes(name)
        `)
        .eq('teacher_id', userId)
        .eq('day_of_week', todayDow)
        .order('start_time', { ascending: true });

    // 3. Get Pending Etüt Requests
    const { data: pendingRequests } = await supabase
        .from('study_sessions')
        .select(`
            *,
            student:profiles!student_id(full_name, classes(name))
        `)
        .eq('teacher_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

    // 4. Get Stats (Mocking some complex counts for performance, or simple queries)
    // Count total unique students? This might be heavy if not optimized. 
    // Let's just count total classes assigned distinct.

    // For now, let's just get a count of pending homeworks assigned by this teacher
    const { count: homeworkCount } = await supabase
        .from('homework')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', userId)
        .gte('due_date', new Date().toISOString());

    // 5. Get Pending Homework Approvals (Status: 'submitted')
    const { data: pendingHomeworks, count: pendingApprovalCount } = await supabase
        .from('homework_submissions')
        .select(`
            id,
            status,
            submitted_at,
            student:profiles!student_id(full_name),
            homework:homework_id(description, teacher_id)
        `, { count: 'exact' })
        .eq('status', 'submitted')
        .eq('homework.teacher_id', userId)
        .order('submitted_at', { ascending: true })
        .limit(10); // Show top 10 pending

    return {
        profile,
        schedule: schedule || [],
        pendingRequests: pendingRequests || [],
        homeworkCount: homeworkCount || 0,
        pendingApprovalCount: pendingApprovalCount || 0,
        pendingHomeworks: pendingHomeworks || []
    };
}

export default async function TeacherDashboardPage() {
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

    const data = await getTeacherData(user.id);
    if (!data) return <div>Yükleniyor...</div>;

    const { profile, schedule, pendingRequests, homeworkCount, pendingApprovalCount, pendingHomeworks } = data;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">

            <div className="md:col-span-3">
                <PendingHomeworkCard initialHomeworks={pendingHomeworks} />
                <PendingSessionsCard />
            </div>

            {/* LEFT COLUMN */}
            <div className="md:col-span-2 space-y-6">

                {/* 1. Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-100">Bugünkü Dersler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{schedule.length}</div>
                            <p className="text-xs text-indigo-200 mt-1">Aktif program</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Bekleyen Etütler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{pendingRequests.length}</div>
                            <p className="text-xs text-slate-500 mt-1">Onay bekleyen talepler</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Aktif Ödevler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{homeworkCount}</div>
                            <p className="text-xs text-slate-500 mt-1">Teslim tarihi gelmemiş</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Onay Bekleyenler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{pendingApprovalCount}</div>
                            <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">Ödev teslimi</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Today's Schedule */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold">Bugünün Programı</CardTitle>
                                <CardDescription>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}</CardDescription>
                            </div>
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {schedule.length > 0 ? (
                            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8 py-2">
                                {schedule.map((item, index) => {
                                    // Determine if current, past, or future based on time (mock logic or real)
                                    // For simplicity, just listing.
                                    return (
                                        <div key={item.id} className="relative pl-6 group">
                                            {/* Dot */}
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500 group-hover:scale-125 transition-transform"></div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                                                        {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                                                    </span>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{item.course_name}</h4>
                                                    <p className="text-sm text-slate-500">Sınıf: {item.classes?.name}</p>
                                                </div>
                                                <Badge variant="outline" className="w-fit">Derslik A-101</Badge>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                                <p>Bugün için planlanmış dersiniz yok.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">

                {/* Pending Etüt Requests */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm h-full">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            Gelen Etüt Talepleri
                        </CardTitle>
                        <CardDescription>Onay bekleyen öğrenci talepleri</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map((req) => (
                                    <div key={req.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h5 className="font-bold text-slate-900 dark:text-white">{req.student?.full_name}</h5>
                                                <p className="text-xs text-slate-500">{req.student?.classes?.name} Sınıfı</p>
                                            </div>
                                            <Badge variant="secondary" className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-100">
                                                {new Date(req.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'short' })}
                                            </Badge>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs text-slate-600 dark:text-slate-300 mb-4 italic">
                                            "{req.topic}"
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/teacher/study-requests`} className="flex-1">
                                                <div className="flex items-center justify-center w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors">
                                                    İncele
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    Bekleyen talep yok.
                                </div>
                            )}

                            {pendingRequests.length > 0 && (
                                <Link href="/teacher/study-requests" className="flex items-center justify-center text-sm text-indigo-600 font-medium hover:underline mt-4">
                                    Tümünü Gör <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
