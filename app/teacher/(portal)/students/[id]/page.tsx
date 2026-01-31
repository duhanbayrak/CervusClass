import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, MapPin, ChevronLeft, TrendingUp, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';

// Mock data generator for charts/stats if real data is scarce
const getMockStats = () => ({
    attendanceRate: 92,
    completedHomeworks: 15,
    pendingHomeworks: 3,
    averageGrade: 78.5
});

async function getStudentProfile(id: string) {
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

    // 1. Get Profile & Class
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
            *,
            classes(name),
            roles!inner(name)
        `)
        .eq('id', id)
        .eq('roles.name', 'student')
        .single();

    if (error || !profile) return null;

    // 2. Get Exam Results (Real data)
    const { data: examResults } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', id)
        .order('exam_date', { ascending: false });

    // 3. Get Recent Attendance (Mock or Real empty)
    // For now assuming empty attendance table, we will show UI placeholder

    return {
        profile,
        examResults: examResults || [],
        stats: getMockStats()
    };
}

export default async function StudentDetailPage({ params }: { params: any }) {
    // Await params object for future Next.js compatibility
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    const data = await getStudentProfile(id);

    if (!data) {
        notFound();
    }

    const { profile, examResults, stats } = data;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Back Link */}
            <div className="flex items-center gap-2">
                <Link href="/teacher/students">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Öğrenci Profili</h2>
                    <p className="text-slate-500 dark:text-slate-400">Akademik durum ve kişisel bilgiler</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        <CardContent className="pt-0 relative">
                            <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-900 absolute -top-12 left-6">
                                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                                <AvatarFallback className="text-xl bg-slate-100 dark:bg-slate-800">
                                    {profile.full_name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="mt-14 mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h3>
                                <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="font-normal">
                                        {profile.classes?.name || 'Sınıfsız'}
                                    </Badge>
                                    <span className="text-xs">#{profile.id.slice(0, 8)}</span>
                                </p>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{profile.email || 'E-posta bilgisi yok'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span>{profile.phone || '+90 5XX XXX XX XX'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>Kayıt: {new Date(profile.created_at).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                                    Mesaj Gönder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Card */}
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Genel Durum</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Ortalama</span>
                                </div>
                                <span className="text-lg font-bold">{stats.averageGrade}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Devamsızlık</span>
                                </div>
                                <span className="text-lg font-bold">%{(100 - stats.attendanceRate).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Tamamlanan Ödev</span>
                                </div>
                                <span className="text-lg font-bold">{stats.completedHomeworks}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Tabs and Details */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="academic" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                            <TabsTrigger value="academic">Akademik</TabsTrigger>
                            <TabsTrigger value="attendance">Devamsızlık</TabsTrigger>
                            <TabsTrigger value="notes">Öğretmen Notları</TabsTrigger>
                        </TabsList>

                        {/* ACADEMIC TAB */}
                        <TabsContent value="academic" className="space-y-4">
                            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Sınav Sonuçları</CardTitle>
                                    <CardDescription>Öğrencinin girdiği son sınavlar ve puanları.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {examResults.length > 0 ? (
                                        <div className="space-y-4">
                                            {examResults.map((exam) => (
                                                <div key={exam.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white">{exam.exam_name}</h4>
                                                        <p className="text-xs text-slate-500">{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{exam.score}</div>
                                                        <div className="text-xs text-slate-400">Puan</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>Henüz kayıtlı sınav sonucu bulunmuyor.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ATTENDANCE TAB */}
                        <TabsContent value="attendance">
                            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Devamsızlık Bilgisi</CardTitle>
                                    <CardDescription>Son 30 günlük devamsızlık kayıtları.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 text-slate-400">
                                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Devamsızlık kaydı bulunamadı (Modül yapım aşamasında).</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* NOTES TAB */}
                        <TabsContent value="notes">
                            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Öğretmen Notları</CardTitle>
                                    <CardDescription>Bu öğrenci hakkında alınan özel notlar.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 text-slate-400">
                                        <p>Henüz not girilmemiş.</p>
                                        <Button variant="outline" className="mt-4">Yeni Not Ekle</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
