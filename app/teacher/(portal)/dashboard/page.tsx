import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PendingSessionsCard } from '@/components/dashboard/teacher/pending-sessions-card';
import { PendingHomeworkCard } from '@/components/dashboard/teacher/pending-homework-card';
import { PendingStudyRequestsList } from '@/components/dashboard/teacher/pending-study-requests-list';
import { getAuthContext } from '@/lib/auth-context';
import { Schedule, StudySession, Homework, HomeworkSubmission } from '@/types/database';
import { MissingAttendanceAlert } from '@/components/dashboard/teacher/missing-attendance-alert';

export default async function TeacherDashboardPage() {
    // Merkezi auth context — tek bir client + getUser + organizationId
    const { supabase, user } = await getAuthContext();
    if (!user) return null;

    // Tüm sorguları tek supabase client ile çalıştır
    const today = new Date();
    let todayDow = today.getDay();
    if (todayDow === 0) todayDow = 7;

    // Paralel veri çekme — tüm sorgular aynı anda çalışır
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().slice(0, 5); // HH:mm

    // Hafta başını bul (Pazartesi)
    const startOfWeek = new Date(now);
    const dayDiff = todayDow - 1; // Pazartesi'den fark
    startOfWeek.setDate(now.getDate() - dayDiff);

    const [
        profileResult,
        scheduleResult,
        pendingRequestsResult,
        homeworkCountResult,
        pendingHomeworksResult,
        pendingSessionActionsResult,
        pastScheduleResult
    ] = await Promise.all([
        // 1. Profil
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),

        // 2. Bugünün programı
        supabase
            .from('schedule')
            .select(`*, classes(name), courses(name)`)
            .eq('teacher_id', user.id)
            .eq('day_of_week', todayDow)
            .order('start_time', { ascending: true }),

        // 3. Bekleyen etüt talepleri
        supabase
            .from('study_sessions')
            .select(`
                *,
                student:profiles!student_id(full_name, classes(name)),
                status:study_session_statuses!inner(name)
            `)
            .eq('teacher_id', user.id)
            .eq('status.name', 'pending')
            .order('created_at', { ascending: false })
            .limit(5),

        // 4. Aktif ödev sayısı
        supabase
            .from('homework')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', user.id)
            .gte('due_date', new Date().toISOString()),

        // 5. Onay bekleyen ödev teslimleri
        supabase
            .from('homework_submissions')
            .select(`
                id,
                status,
                submitted_at,
                student:profiles!student_id(full_name),
                homework:homework_id(description, teacher_id)
            `, { count: 'exact' })
            .eq('status', 'submitted')
            .eq('homework.teacher_id', user.id)
            .order('submitted_at', { ascending: true })
            .order('submitted_at', { ascending: true })
            .limit(10),

        // 6. İşlem bekleyen GEÇMİŞ etütler (Geldi/Gelmedi işaretlenmemis)
        supabase
            .from('study_sessions')
            .select(`
                id,
                topic,
                scheduled_at,
                student_id,
                profiles:student_id (full_name),
                status:study_session_statuses!inner(name)
            `)
            .eq('teacher_id', user.id)
            .eq('status.name', 'pending')
            .lt('scheduled_at', new Date().toISOString())
            .lt('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true }),

        // 7. Geçmiş Dersler ve Yoklamaları (Hafta başından itibaren)
        supabase
            .from('schedule')
            .select(`
                *,
                classes(name),
                courses(name),
                attendance(date)
            `)
            .eq('teacher_id', user.id)
            .gte('day_of_week', 1) // Pazartesiden
            .lte('day_of_week', todayDow) // Bugüne kadar
    ]);

    const profile = profileResult.data;
    if (!profile) return <div>Yükleniyor...</div>;

    const schedule = (scheduleResult.data || []) as any[];
    const pendingRequests = (pendingRequestsResult.data || []) as unknown as StudySession[];
    const homeworkCount = homeworkCountResult.count || 0;
    const pendingApprovalCount = pendingHomeworksResult.count || 0;
    const pendingHomeworks = (pendingHomeworksResult.data || []) as unknown as HomeworkSubmission[];

    const pendingSessionActions = (pendingSessionActionsResult.data || []) as unknown as StudySession[];
    const pastSchedules = (pastScheduleResult.data || []) as unknown as any[];

    // --- EKSİK YOKLAMA HESAPLAMA ---
    const missingAttendanceItems: any[] = [];

    pastSchedules.forEach(item => {
        // Hedef tarihi hesapla
        const itemDayDow = item.day_of_week;
        const diff = itemDayDow - 1; // Pazartesi(1) -> 0 fark
        const targetDateObj = new Date(startOfWeek);
        targetDateObj.setDate(startOfWeek.getDate() + diff);
        const targetDateStr = targetDateObj.toISOString().split('T')[0];

        // Gelecek dersleri ele (Bugünün ilerleyen saatleri)
        if (targetDateStr > todayStr) return; // İmkansız ama güvenli olsun
        if (targetDateStr === todayStr && item.start_time > currentTimeStr) return; // Bugün henüz başlamamış ders

        // Yoklama var mı kontrol et
        const hasAttendance = item.attendance?.some((att: any) => att.date === targetDateStr);

        if (!hasAttendance) {
            missingAttendanceItems.push({
                id: item.id,
                courseName: item.courses?.name,
                className: item.classes?.name,
                startTime: item.start_time?.slice(0, 5),
                endTime: item.end_time?.slice(0, 5),
                dayOfWeek: item.day_of_week,
                date: targetDateStr
            });
        }
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">

            <div className="md:col-span-3">
                <MissingAttendanceAlert missingItems={missingAttendanceItems} />
                <PendingHomeworkCard initialHomeworks={pendingHomeworks} />
                <PendingSessionsCard initialSessions={pendingSessionActions} />
            </div>

            {/* SOL SÜTUN */}
            <div className="md:col-span-2 space-y-6">

                {/* 1. İstatistik kartları */}
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

                {/* 2. Bugünün Programı */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold">Bugünün Programı</CardTitle>
                                <CardDescription>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}</CardDescription>
                            </div>
                            <Link href="/teacher/schedule" className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer">
                                <CalendarIcon className="w-5 h-5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {schedule.length > 0 ? (
                            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8 py-2">
                                {schedule.map((item) => {
                                    return (
                                        <div key={item.id} className="relative pl-6 group">
                                            {/* Nokta */}
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500 group-hover:scale-125 transition-transform"></div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                                                        {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                                                    </span>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{item.courses?.name || 'Ders'}</h4>
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

            {/* SAĞ SÜTUN */}
            <div className="space-y-6">

                {/* Bekleyen Etüt Talepleri */}
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
                            <PendingStudyRequestsList requests={pendingRequests.map(r => ({ ...r, topic: r.topic || '' }))} />

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
