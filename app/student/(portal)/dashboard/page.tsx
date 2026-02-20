import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Calendar as CalendarIcon, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { Schedule, Homework, ExamResult, StudySession } from '@/types/database';

export default async function StudentDashboardPage() {
    // Merkezi auth context — tek supabase client
    const { supabase, user } = await getAuthContext();

    if (!user) {
        redirect('/student/login');
    }

    // 1. Profil bilgisini al
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, classes(name)')
        .eq('id', user.id)
        .single();

    if (!profile) return <div>Öğrenci verileri yükleniyor...</div>;

    // 2. Paralel veri çekme — tüm sorgular aynı anda çalışır
    const today = new Date();
    let todayDow = today.getDay();
    if (todayDow === 0) todayDow = 7;

    const [scheduleResult, homeworkResult, examsResult, etutsResult] = await Promise.all([
        // Bugünün programı
        profile.class_id
            ? supabase
                .from('schedule')
                .select(`*, teacher:profiles!teacher_id(full_name), courses(name)`)
                .eq('class_id', profile.class_id)
                .eq('day_of_week', todayDow)
                .order('start_time', { ascending: true })
            : Promise.resolve({ data: [] }),

        // Yaklaşan ödevler
        profile.class_id
            ? supabase
                .from('homework')
                .select(`*, teacher:profiles!teacher_id(full_name), courses(name)`)
                .eq('class_id', profile.class_id)
                .eq('due_date', new Date().toISOString())
                .or(`assigned_student_ids.is.null,assigned_student_ids.cs.["${user.id}"]`)
                .order('due_date', { ascending: true })
                .limit(5)
            : Promise.resolve({ data: [] }),

        // Son sınav sonuçları
        supabase
            .from('exam_results')
            .select('*')
            .eq('student_id', user.id)
            .order('exam_date', { ascending: false })
            .limit(3),

        // Etüt talepleri
        supabase
            .from('study_sessions')
            .select(`*, teacher:profiles!teacher_id(full_name), study_session_statuses!inner(name)`)
            .eq('student_id', user.id)
            .neq('study_session_statuses.name', 'completed')
            .neq('study_session_statuses.name', 'cancelled')
            .order('scheduled_at', { ascending: true })
    ]);

    const schedule = (scheduleResult.data || []) as any[];
    const homework = (homeworkResult.data || []) as any[];
    const exams = (examsResult.data || []) as unknown as ExamResult[];

    const etuts = (etutsResult.data || []) as any[];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* SOL SÜTUN */}
            <div className="md:col-span-2 space-y-6">

                {/* 1. İstatistik Kartları */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Ortalama Net */}
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

                    {/* Bekleyen Ödevler */}
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Bekleyen Ödevler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{homework.length}</div>
                            <p className="text-xs text-slate-500 mt-1">Yaklaşan teslim tarihli</p>
                        </CardContent>
                    </Card>

                    {/* Etüt Talepleri */}
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Etüt Talepleri</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                {etuts.filter((e) => {
                                    const status = e.study_session_statuses?.name || 'pending';
                                    return status === 'pending';
                                }).length}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Onay bekleyen</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Bugünün Programı */}
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
                                                <h4 className="font-bold text-slate-900 dark:text-white">{item.courses?.name || 'Ders'}</h4>
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

                {/* 3. Son Sınav Sonuçları */}
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
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white">{exam.exam_name}</h4>
                                                {exam.exam_type === 'TYT' && (
                                                    <Badge className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                                                        TYT
                                                    </Badge>
                                                )}
                                                {exam.exam_type === 'AYT' && (
                                                    <Badge className="h-5 px-1.5 text-[10px] bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                                                        AYT
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('tr-TR') : '-'}</p>
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

            {/* SAĞ SÜTUN */}
            <div className="space-y-6">

                {/* Ödevler */}
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
                                                {hw.due_date ? new Date(hw.due_date).toLocaleDateString('tr-TR') : '-'}
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

                {/* Etüt Talepleri */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            Etüt Talepleri
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {etuts.map((etut: any) => {
                                const status = etut.study_session_statuses?.name || 'pending';
                                return (
                                    <div key={etut.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className={`w-2 h-full min-h-[40px] rounded-full ${status === 'pending' ? 'bg-yellow-400' :
                                            status === 'approved' ? 'bg-green-500' :
                                                status === 'rejected' ? 'bg-red-500' : 'bg-slate-300'
                                            }`}></div>
                                        <div className="flex-1">
                                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">{etut.topic}</h5>
                                            <p className="text-xs text-slate-500">
                                                {etut.teacher?.full_name} • {new Date(etut.scheduled_at).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={`capitalize text-[10px] ${status === 'pending' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                                            status === 'approved' ? 'text-green-600 border-green-200 bg-green-50' :
                                                'text-slate-500'
                                            }`}>
                                            {status === 'pending' ? 'Bekliyor' : status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                                        </Badge>
                                    </div>
                                )
                            })}
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
