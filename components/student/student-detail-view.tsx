'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import {
    Mail, Phone, Calendar, ChevronLeft, TrendingUp, Check, X, Clock, LineChart,
    User, Users, Hash, Cake, Pencil
} from 'lucide-react';
import { cn, formatPhone } from '@/lib/utils';
import { StudentDialog } from '@/components/student/student-dialog';
import { useToast } from '@/components/ui/use-toast';
import { CopyableInfoRow, StatMiniCard } from './detail/info-cards';
import { StudentAcademicTab } from './detail/academic-tab';
import { StudentAttendanceTab } from './detail/attendance-tab';
import { StudentNotesTab } from './detail/notes-tab';
import { StudentFinancialTab } from './detail/financial-tab';

interface OmitOptionalStats {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
}

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
            class: OmitOptionalStats;
            study: {
                total: number;
                attended: number;
                missed: number;
                rate: number;
            };
        };
        averageGrade: number;
    };
    role: 'admin' | 'teacher' | 'parent';
    financialData?: {
        fees: any[];
        installments: any[];
        payments: any[];
    };
}

export function StudentDetailView({ profile, examResults, stats, role, financialData }: StudentDetailViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const backLink = role === 'admin' ? '/admin/students' : '/teacher/students';

    // Profil düzenleme dialog state'i
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // StudentDialog'un beklediği Student tipine dönüşüm
    const studentForDialog = {
        ...profile,
        class: profile.classes ? { id: profile.class_id, name: profile.classes.name, grade_level: 0 } : null,
    };

    // Kayıt sonrası sayfayı yenile
    const handleSave = () => {
        setEditDialogOpen(false);
        router.refresh();
        toast({ description: "Profil başarıyla güncellendi." });
    };

    // Doğum tarihini formatla
    const formattedBirthDate = profile.birth_date
        ? new Date(profile.birth_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;



    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={backLink}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Öğrenci Profili
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Kişisel bilgiler ve akademik durum
                        </p>
                    </div>
                </div>

                {/* Düzenle Butonu (Header'da) */}
                {role === 'admin' && (
                    <Button
                        onClick={() => setEditDialogOpen(true)}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Profili Düzenle</span>
                    </Button>
                )}
            </div>

            {/* Üst Profil Kartı — Minimalist */}
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                {/* İnce üst accent çizgisi */}
                <div className="h-1 bg-gradient-to-r from-slate-800 via-slate-600 to-slate-400 dark:from-slate-300 dark:via-slate-500 dark:to-slate-700" />

                <CardContent className="py-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {/* Avatar */}
                        <Avatar className="h-20 w-20 border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                            <AvatarFallback className="text-xl font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {(profile.full_name || '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {/* İsim ve Bilgiler */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                {profile.full_name}
                            </h3>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                                <Badge
                                    variant="secondary"
                                    className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 font-medium"
                                >
                                    {profile.classes?.name || 'Sınıfsız'}
                                </Badge>
                                {profile.student_number && (
                                    <Badge variant="outline" className="font-mono text-xs text-slate-500">
                                        #{profile.student_number}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                Kayıt: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Kolon: İletişim Bilgileri */}
                <div className="lg:col-span-1 space-y-6">
                    {/* İletişim Bilgileri */}
                    <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" />
                                Öğrenci Bilgileri
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Tıklayarak kopyalayabilirsiniz
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 pt-0">
                            <CopyableInfoRow
                                icon={Mail}
                                label="E-posta"
                                value={profile.email}
                                placeholder="Kayıtlı değil"
                            />
                            <CopyableInfoRow
                                icon={Phone}
                                label="Telefon"
                                value={formatPhone(profile.phone)}
                                placeholder="Kayıtlı değil"
                            />
                            <CopyableInfoRow
                                icon={Hash}
                                label="Öğrenci No"
                                value={profile.student_number}
                                placeholder="Atanmadı"
                            />
                            <CopyableInfoRow
                                icon={Cake}
                                label="Doğum Tarihi"
                                value={formattedBirthDate}
                                placeholder="Belirtilmedi"
                            />
                        </CardContent>
                    </Card>

                    {/* Veli Bilgileri */}
                    <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-500" />
                                Veli Bilgileri
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Tıklayarak kopyalayabilirsiniz
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 pt-0">
                            <CopyableInfoRow
                                icon={User}
                                label="Veli Adı"
                                value={profile.parent_name}
                                placeholder="Kayıtlı değil"
                            />
                            <CopyableInfoRow
                                icon={Phone}
                                label="Veli Telefon"
                                value={formatPhone(profile.parent_phone)}
                                placeholder="Kayıtlı değil"
                            />
                        </CardContent>
                    </Card>

                    {/* Genel İstatistikler */}
                    <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Genel Durum
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                            <StatMiniCard
                                icon={TrendingUp}
                                label="Ortalama"
                                value={stats.averageGrade || '—'}
                                color="indigo"
                            />
                            <StatMiniCard
                                icon={Check}
                                label="Yapılan Ödev"
                                value={stats.homework.approved}
                                color="green"
                            />
                            <StatMiniCard
                                icon={X}
                                label="Yapılmayan"
                                value={stats.homework.rejected}
                                color="red"
                            />
                            <StatMiniCard
                                icon={Clock}
                                label="Bekleyen"
                                value={stats.homework.pending}
                                color="orange"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Sağ Kolon: Sekmeler */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="academic" className="space-y-4">
                        <TabsList className={cn(
                            "grid w-full bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl",
                            role === 'admin' ? "grid-cols-4 lg:w-[500px]" : "grid-cols-3 lg:w-[400px]"
                        )}>
                            <TabsTrigger value="academic" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                                Akademik
                            </TabsTrigger>
                            <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                                Devamsızlık
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                                Notlar
                            </TabsTrigger>
                            {role === 'admin' && (
                                <TabsTrigger value="financial" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                                    Finansal
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="academic" className="space-y-4">
                            <StudentAcademicTab
                                examResults={examResults}
                                role={role}
                                studentId={profile.id}
                            />
                        </TabsContent>

                        <TabsContent value="attendance">
                            <StudentAttendanceTab stats={stats} />
                        </TabsContent>

                        <TabsContent value="notes">
                            <StudentNotesTab role={role} />
                        </TabsContent>

                        {role === 'admin' && financialData && (
                            <TabsContent value="financial" className="space-y-4 mt-6">
                                <StudentFinancialTab data={financialData} />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </div>

            {/* Profil Düzenleme Dialog'u */}
            {role === 'admin' && (
                <StudentDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    student={studentForDialog}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
