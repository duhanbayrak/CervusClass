'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Clock, Loader2, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { assessHomework } from '@/lib/actions/teacher-homework';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Submissions {
    id: string; // submission id
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    submitted_at: string | null;
    student: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        student_number: string | null;
    };
}

interface HomeworkDetailViewProps {
    homework: {
        id: string;
        description: string;
        due_date: string;
        class_name: string;
        course_name: string;
    };
    submissions: Submissions[];
}

export default function HomeworkDetailView({ homework, submissions }: HomeworkDetailViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isRevisionRequired, setIsRevisionRequired] = useState(false);

    const showAssessToast = (status: 'approved' | 'rejected' | 'pending', studentName: string, error?: string) => {
        if (error) { toast({ variant: "destructive", title: "Hata", description: error }); return }
        const titles = { pending: "Revizyon İstendi", approved: "Ödev Onaylandı", rejected: "Ödev Reddedildi" }
        const descriptions = {
            pending: `${studentName} isimli öğrenciye revizyon talebi iletildi.`,
            approved: `${studentName} isimli öğrencinin ödevi onaylandı.`,
            rejected: `${studentName} isimli öğrencinin ödevi reddedildi.`,
        }
        toast({
            title: titles[status],
            description: descriptions[status],
            variant: status === 'rejected' ? "destructive" : "default",
            className: status === 'approved' ? "bg-green-600 text-white border-none" : ""
        })
    }

    const handleAssess = async (submissionId: string, status: 'approved' | 'rejected' | 'pending', studentName: string, feedback?: string) => {
        setLoadingMap(prev => ({ ...prev, [submissionId]: true }));
        try {
            const result = await assessHomework({ submissionId, status, feedback });
            showAssessToast(status, studentName, result.success ? undefined : (result.error || "İşlem başarısız."))
            if (result.success) router.refresh();
        } catch {
            toast({ variant: "destructive", title: "Hata", description: "Beklenmedik bir hata oluştu." });
        } finally {
            setLoadingMap(prev => ({ ...prev, [submissionId]: false }));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Onaylandı</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Reddedildi/Eksik</Badge>;
            case 'submitted':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Teslim Edildi</Badge>;
            default:
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Bekliyor</Badge>;
        }
    };

    // Filter submissions by status
    const submittedSubmissions = submissions.filter(s => s.status === 'submitted');
    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    const finalizedSubmissions = submissions.filter(s => s.status === 'approved' || s.status === 'rejected');

    // Helper to render a list of cards
    const renderSubmissionList = (items: Submissions[], emptyMessage: string) => {
        if (items.length === 0) {
            return (
                <Card>
                    <CardContent className="text-center py-8 text-slate-500">
                        {emptyMessage}
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((sub) => (
                    <Card key={sub.id} className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={sub.student.avatar_url || undefined} />
                                        <AvatarFallback>{sub.student.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-sm">{sub.student.full_name}</div>
                                        <div className="text-xs text-slate-500">#{sub.student.student_number || '---'}</div>
                                    </div>
                                </div>
                                {getStatusBadge(sub.status)}
                            </div>

                            {sub.submitted_at && (
                                <div className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Teslim: {new Date(sub.submitted_at).toLocaleDateString('tr-TR')} {new Date(sub.submitted_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}

                            <div className="flex gap-2 mt-4">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleAssess(sub.id, 'approved', sub.student.full_name)}
                                    disabled={loadingMap[sub.id] || sub.status === 'approved'}
                                >
                                    {loadingMap[sub.id] && sub.status !== 'approved' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-1" />
                                    )}
                                    Onayla
                                </Button>

                                <Dialog open={isDialogOpen && loadingMap[sub.id] === undefined} onOpenChange={(open) => {
                                    setIsDialogOpen(open);
                                    if (!open) {
                                        setFeedbackText('');
                                        setIsRevisionRequired(false);
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            disabled={loadingMap[sub.id] || sub.status === 'rejected'}
                                            onClick={() => setIsDialogOpen(true)}
                                        >
                                            {loadingMap[sub.id] && sub.status !== 'rejected' ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <X className="w-4 h-4 mr-1" />
                                            )}
                                            Reddet
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Ödevi Reddet / Revizyon İste</DialogTitle>
                                            <DialogDescription>
                                                {sub.student.full_name} isimli öğrencinin ödevi için işlem yapıyorsunuz.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`feedback-${sub.id}`}>Öğretmen Görüşü (Zorunlu)</Label>
                                                <Textarea
                                                    id={`feedback-${sub.id}`}
                                                    placeholder="Reddetme veya revizyon nedenini açıklayınız..."
                                                    className="min-h-[100px]"
                                                    value={feedbackText}
                                                    onChange={(e) => setFeedbackText(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`revision-${sub.id}`}
                                                    checked={isRevisionRequired}
                                                    onCheckedChange={(checked) => setIsRevisionRequired(!!checked)}
                                                />
                                                <Label htmlFor={`revision-${sub.id}`} className="font-medium text-slate-700 cursor-pointer">
                                                    Revizyon İste (Öğrenciye Tekrar Ata)
                                                </Label>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                İşaretlenirse ödev durumu "Bekliyor" olur ve öğrenci tekrar gönderim yapabilir.
                                                İşaretlenmezse "Reddedildi" olarak işaretlenir.
                                            </p>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">İptal</Button>
                                            </DialogClose>
                                            <Button
                                                variant="destructive"
                                                onClick={() => {
                                                    if (!feedbackText.trim()) {
                                                        toast({
                                                            title: "Hata",
                                                            description: "Lütfen bir açıklama giriniz.",
                                                            variant: "destructive"
                                                        });
                                                        return;
                                                    }
                                                    handleAssess(sub.id, isRevisionRequired ? 'pending' : 'rejected', sub.student.full_name, feedbackText);
                                                }}
                                                disabled={loadingMap[sub.id]}
                                            >
                                                {loadingMap[sub.id] ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : null}
                                                İşlemi Tamamla
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/teacher/homework">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ödev Detayı</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            {homework.class_name} • {homework.course_name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Homework Info Card */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle>Ödev Bilgileri</CardTitle>
                    <CardDescription>
                        Son Teslim: {new Date(homework.due_date).toLocaleDateString('tr-TR')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {homework.description}
                    </p>
                </CardContent>
            </Card>

            {/* Tabs for Workflow */}
            <Tabs defaultValue="submitted" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                    <TabsTrigger value="submitted">
                        Onay Bekleyenler
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 pointer-events-none">
                            {submittedSubmissions.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        Teslim Etmeyenler
                        <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-700 pointer-events-none">
                            {pendingSubmissions.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="finalized">
                        Sonuçlananlar
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 pointer-events-none">
                            {finalizedSubmissions.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                    <TabsContent value="submitted" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Onay Bekleyen Öğrenciler</h3>
                            <span className="text-sm text-slate-500">Öğrenci "Teslim Et" butonuna bastı.</span>
                        </div>
                        {renderSubmissionList(submittedSubmissions, "Onay bekleyen ödev bulunmuyor.")}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Henüz Teslim Etmeyenler</h3>
                            <span className="text-sm text-slate-500">Öğrenciler henüz işlem yapmadı.</span>
                        </div>
                        {renderSubmissionList(pendingSubmissions, "Tüm öğrenciler ödevini teslim etti.")}
                    </TabsContent>

                    <TabsContent value="finalized" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sonuçlanan Ödevler</h3>
                            <span className="text-sm text-slate-500">Onaylanan veya reddedilen ödevler.</span>
                        </div>
                        {renderSubmissionList(finalizedSubmissions, "Henüz sonuçlanmış bir ödev bulunmuyor.")}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
