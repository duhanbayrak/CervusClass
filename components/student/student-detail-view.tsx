
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, ChevronLeft, TrendingUp, Check, X, Clock, LineChart } from 'lucide-react';
import Link from 'next/link';

interface StudentDetailViewProps {
    profile: any;
    examResults: any[];
    stats: {
        homework: {
            approved: number;
            rejected: number;
            pending: number;
            total: number;
        };
        attendance: {
            class: {
                total: number;
                present: number;
                absent: number;
                late: number;
                excused: number;
                rate: number;
            };
            study: {
                total: number;
                attended: number;
                missed: number;
                rate: number;
            };
        };
        averageGrade: number;
    };
    role: 'admin' | 'teacher';
}

export function StudentDetailView({ profile, examResults, stats, role }: StudentDetailViewProps) {
    const backLink = role === 'admin' ? '/admin/students' : '/teacher/students';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Back Link */}
            <div className="flex items-center gap-2">
                <Link href={backLink}>
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
                {/* Left Column: Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        <CardContent className="pt-0 relative">
                            <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-900 absolute -top-12 left-6">
                                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                                <AvatarFallback className="text-xl bg-slate-100 dark:bg-slate-800">
                                    {(profile.full_name || '?').slice(0, 2).toUpperCase()}
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
                                {role === 'admin' ? (
                                    <Button className="w-full" variant="outline">
                                        Profili Düzenle
                                    </Button>
                                ) : (
                                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                                        Mesaj Gönder
                                    </Button>
                                )}
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
                                <span className="text-lg font-bold">{stats.averageGrade || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Yapılan Ödev</span>
                                </div>
                                <span className="text-lg font-bold text-green-600">{stats.homework.approved}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                        <X className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Yapılmayan Ödev</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">{stats.homework.rejected}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Bekleyen Ödev</span>
                                </div>
                                <span className="text-lg font-bold text-orange-600">{stats.homework.pending}</span>
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
                            <TabsTrigger value="notes">Notlar</TabsTrigger>
                        </TabsList>

                        {/* ACADEMIC TAB */}
                        <TabsContent value="academic" className="space-y-4">
                            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                                    <div className="space-y-1">
                                        <CardTitle>Sınav Sonuçları</CardTitle>
                                        <CardDescription>Öğrencinin girdiği son sınavlar ve puanları.</CardDescription>
                                    </div>
                                    {role === 'teacher' && (
                                        <Link href={`/teacher/students/${profile.id}/exams`}>
                                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                                <LineChart className="h-4 w-4" />
                                                Tüm Sınav Detaylarını Gör
                                            </Button>
                                        </Link>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {examResults.length > 0 ? (
                                        <div className="space-y-4">
                                            {examResults.map((exam) => {
                                                const examUrl = role === 'teacher'
                                                    ? `/teacher/exams/${encodeURIComponent(exam.exam_name)}/students/${profile.id}`
                                                    : `/student/exams/${exam.id}`;

                                                return (
                                                    <Link
                                                        key={exam.id}
                                                        href={examUrl}
                                                        className="block group"
                                                    >
                                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer group-hover:border-indigo-200 dark:group-hover:border-indigo-900/50">
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                    {exam.exam_name}
                                                                </h4>
                                                                <p className="text-xs text-slate-500">
                                                                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('tr-TR') : 'Tarih Belirtilmemiş'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right flex items-center gap-4">
                                                                <div>
                                                                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                                                        {exam.total_net ?? '-'}
                                                                    </div>
                                                                    <div className="text-xs text-slate-400">Net</div>
                                                                </div>
                                                                <ChevronLeft className="h-4 w-4 rotate-180 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
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
                                        {role === 'teacher' && (
                                            <Button variant="outline" className="mt-4">Yeni Not Ekle</Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div >
        </div >
    );
}
