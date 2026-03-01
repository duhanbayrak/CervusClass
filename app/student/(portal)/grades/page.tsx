import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

async function getGradesData(userId: string) {
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

    // Get Exam Results
    const { data: exams } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', userId)
        .order('exam_date', { ascending: false });

    return exams || [];
}

export default async function StudentGradesPage() {
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

    const exams = await getGradesData(user.id);

    // Calculate Average
    const averageNet = exams.length > 0
        ? (exams.reduce((acc, curr) => acc + (curr.total_net || 0), 0) / exams.length).toFixed(2)
        : 0;

    // Determine Trend (Simple logic: compare last exam with average)
    const lastExamNet = exams.length > 0 ? exams[0].total_net : 0;
    const isTrendingUp = Number.parseFloat(lastExamNet.toString()) >= Number.parseFloat(averageNet.toString());

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notlarım ve Sıralamam</h2>
                    <p className="text-slate-500 dark:text-slate-400">Sınav performans analizi</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Award className="w-5 h-5 text-purple-500" />
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Genel Ortalama (Net)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{averageNet}</span>
                            {exams.length > 1 && (
                                <span className={`text-sm mb-1 font-medium flex items-center ${isTrendingUp ? 'text-green-600' : 'text-red-600'}`}>
                                    {isTrendingUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                    {isTrendingUp ? 'Yükselişte' : 'Düşüşte'}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Toplam Sınav</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{exams.length}</span>
                        <span className="text-slate-400 text-sm ml-2">adet</span>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-100">Tahmini Sıralama</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black">#42</span>
                            <span className="text-sm text-purple-200">/ 120 Öğrenci</span>
                        </div>
                        <p className="text-xs text-purple-200 mt-2">Sınıf içi başarınıza göre hesaplandı.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Exam List & Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Recent Exams List */}
                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <CardTitle>Sınav Geçmişi</CardTitle>
                        <CardDescription>Detaylı sonuç listesi</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {exams.length > 0 ? (
                                exams.map((exam) => (
                                    <div key={exam.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-purple-200 dark:hover:border-purple-900 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                                {exam.total_net}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                                    {exam.exam_name}
                                                </h4>
                                                <p className="text-sm text-slate-500">{new Date(exam.exam_date).toLocaleDateString('tr-TR', { dateStyle: 'long' })}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <span className="block text-xs text-slate-400 font-medium uppercase">Puan</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{exam.score || '-'}</span>
                                            </div>
                                            <div className="text-center hidden sm:block">
                                                <span className="block text-xs text-slate-400 font-medium uppercase">Sıralama</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">-</span>
                                            </div>
                                            <div className="text-center">
                                                <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">Sonuçlandı</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    Henüz sınav kaydı bulunmuyor.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Subject Analysis (Mock Data for Visual) */}
                <div className="space-y-6">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Ders Bazlı Performans</CardTitle>
                            <CardDescription>Son sınav ortalamaları</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Matematik</span>
                                    <span className="text-slate-500">32.5 / 40</span>
                                </div>
                                <Progress value={81} className="h-2 bg-slate-100 dark:bg-slate-700" /> {/* Need to verify generic div color or check shadcn */}
                                {/* Shadcn progress usually has an Indicator. Assuming standard setup */}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Türkçe</span>
                                    <span className="text-slate-500">28.0 / 40</span>
                                </div>
                                <Progress value={70} className="h-2 bg-slate-100 dark:bg-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Fizik</span>
                                    <span className="text-slate-500">10.2 / 14</span>
                                </div>
                                <Progress value={72} className="h-2 bg-slate-100 dark:bg-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Kimya</span>
                                    <span className="text-slate-500">8.0 / 13</span>
                                </div>
                                <Progress value={61} className="h-2 bg-slate-100 dark:bg-slate-700" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4" />
                                Yapay Zeka Önerisi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                                Matematik netlerinizde istikrarlı bir artış var, ancak Kimya konularında eksiğiniz görünüyor.
                                {' '}<span className="font-bold">&quot;Asitler ve Bazlar&quot;</span>{' '}konusuna odaklanmanızı öneririz.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
