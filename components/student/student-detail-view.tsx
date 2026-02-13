
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import {
    Mail, Phone, Calendar, ChevronLeft, TrendingUp, Check, X, Clock,
    Copy, CheckCheck, User, Users, Hash, Cake, Pencil
} from 'lucide-react';
import Link from 'next/link';
import { StudentDialog } from '@/components/student/student-dialog';
import { useToast } from '@/components/ui/use-toast';

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

/**
 * Tek tıkla kopyalanabilir bilgi satırı bileşeni.
 * Tıklanınca değeri panoya kopyalar ve geçici olarak onay ikonu gösterir.
 */
function CopyableInfoRow({ icon: Icon, label, value, placeholder }: {
    icon: React.ElementType;
    label: string;
    value: string | null | undefined;
    placeholder?: string;
}) {
    const [copied, setCopied] = useState(false);
    const displayValue = value || placeholder || '—';
    const hasTrueValue = !!value;

    // Panoya kopyalama işlemi
    const handleCopy = async () => {
        if (!hasTrueValue) return;
        try {
            await navigator.clipboard.writeText(value!);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API desteklenmiyorsa sessizce geç
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={!hasTrueValue}
            className={`
                group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left
                transition-all duration-200
                ${hasTrueValue
                    ? 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer active:scale-[0.98]'
                    : 'cursor-default opacity-60'
                }
            `}
        >
            {/* İkon */}
            <div className={`
                flex-shrink-0 p-2 rounded-lg transition-colors duration-200
                ${hasTrueValue
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600'
                }
            `}>
                <Icon className="w-4 h-4" />
            </div>

            {/* Etiket ve Değer */}
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {label}
                </p>
                <p className={`text-sm font-medium truncate ${hasTrueValue ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                    {displayValue}
                </p>
            </div>

            {/* Kopyalama göstergesi */}
            {hasTrueValue && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {copied ? (
                        <CheckCheck className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                </div>
            )}
        </button>
    );
}

/**
 * Mini istatistik kartı bileşeni.
 */
function StatMiniCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: 'green' | 'blue' | 'red' | 'orange' | 'indigo';
}) {
    const colorMap = {
        green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
        orange: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    };

    const valueColorMap = {
        green: 'text-emerald-600 dark:text-emerald-400',
        blue: 'text-blue-600 dark:text-blue-400',
        red: 'text-red-600 dark:text-red-400',
        orange: 'text-amber-600 dark:text-amber-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
            <span className={`text-lg font-bold tabular-nums ${valueColorMap[color]}`}>
                {value}
            </span>
        </div>
    );
}

export function StudentDetailView({ profile, examResults, stats, role }: StudentDetailViewProps) {
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

    // Telefon numarasını formatla (5XXXXXXXXX → 5XX XXX XX XX)
    const formatPhone = (phone: string | null | undefined) => {
        if (!phone) return null;
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 10) {
            return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
        }
        return phone;
    };

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
                        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                            <TabsTrigger value="academic" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                                Akademik
                            </TabsTrigger>
                            <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                                Devamsızlık
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                                Notlar
                            </TabsTrigger>
                        </TabsList>

                        {/* AKADEMİK SEKMESİ */}
                        <TabsContent value="academic" className="space-y-4">
                            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Sınav Sonuçları</CardTitle>
                                    <CardDescription>Son girilen sınavlar ve puanları</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {examResults.length > 0 ? (
                                        <div className="space-y-3">
                                            {examResults.map((exam) => (
                                                <div
                                                    key={exam.id}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors"
                                                >
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-white">
                                                            {exam.exam_name}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                            {exam.score}
                                                        </div>
                                                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                                                            Puan
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
                                                <TrendingUp className="w-8 h-8 opacity-40" />
                                            </div>
                                            <p className="text-sm">Henüz kayıtlı sınav sonucu bulunmuyor.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* DEVAMSIZLIK SEKMESİ */}
                        <TabsContent value="attendance">
                            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Devamsızlık Bilgisi</CardTitle>
                                    <CardDescription>Ders ve etüt devamsızlık kayıtları</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Ders Devamsızlık İstatistikleri */}
                                    {stats.attendance.class.total > 0 ? (
                                        <div className="space-y-6">
                                            {/* İlerleme Çubuğu */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Ders Katılım Oranı
                                                    </span>
                                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                        %{stats.attendance.class.rate}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                                        style={{ width: `${stats.attendance.class.rate}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <StatMiniCard icon={Check} label="Katıldı" value={stats.attendance.class.present} color="green" />
                                                <StatMiniCard icon={Clock} label="Geç Kaldı" value={stats.attendance.class.late} color="orange" />
                                                <StatMiniCard icon={X} label="Gelmedi" value={stats.attendance.class.absent} color="red" />
                                                <StatMiniCard icon={Calendar} label="İzinli" value={stats.attendance.class.excused} color="blue" />
                                            </div>

                                            {/* Etüt İstatistikleri */}
                                            {stats.attendance.study.total > 0 && (
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Etüt Katılım Oranı
                                                        </span>
                                                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                            %{stats.attendance.study.rate}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                                                            style={{ width: `${stats.attendance.study.rate}%` }}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                                        <StatMiniCard icon={Check} label="Katıldı" value={stats.attendance.study.attended} color="green" />
                                                        <StatMiniCard icon={X} label="Gelmedi" value={stats.attendance.study.missed} color="red" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
                                                <Calendar className="w-8 h-8 opacity-40" />
                                            </div>
                                            <p className="text-sm">Henüz devamsızlık kaydı bulunmuyor.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* NOTLAR SEKMESİ */}
                        <TabsContent value="notes">
                            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Öğretmen Notları</CardTitle>
                                    <CardDescription>Bu öğrenci hakkında alınan özel notlar</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 text-slate-400">
                                        <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
                                            <Pencil className="w-8 h-8 opacity-40" />
                                        </div>
                                        <p className="text-sm">Henüz not girilmemiş.</p>
                                        {role === 'teacher' && (
                                            <Button variant="outline" className="mt-4 gap-2">
                                                <Pencil className="w-4 h-4" />
                                                Yeni Not Ekle
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
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
