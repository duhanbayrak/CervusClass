"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Calendar, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { approveSession, rejectSession } from '@/lib/actions/study-session';

interface StudySession {
    id: string;
    student: {
        full_name: string;
        avatar_url: string | null;
        classes: { name: string } | null;
    };
    topic: string;
    scheduled_at: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    student_note?: string;
}

interface StudyRequestsListProps {
    pendingRequests: StudySession[];
    pastRequests: StudySession[];
}

export default function StudyRequestsList({ pendingRequests, pastRequests }: Readonly<StudyRequestsListProps>) { // NOSONAR
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
        setIsUpdating(true);
        try {
            let result;
            if (newStatus === 'approved') {
                result = await approveSession(id);
            } else {
                result = await rejectSession(id);
            }

            if (result.error) throw new Error(result.error);

            toast({
                title: "Başarılı",
                description: `Talep ${newStatus === 'approved' ? 'onaylandı' : 'reddedildi'}.`
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: "Hata",
                description: error.message || "İşlem sırasında bir hata oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
                <TabsTrigger value="pending">Bekleyenler ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="history">Geçmiş ({pastRequests.length})</TabsTrigger>
            </TabsList>

            {/* PENDING REQUESTS */}
            <TabsContent value="pending" className="space-y-4">
                {pendingRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingRequests.map((req) => (
                            <Card key={req.id} className="border-l-4 border-l-yellow-400">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-2 rounded-full">
                                                <User className="w-5 h-5 text-slate-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{req.student.full_name}</CardTitle>
                                                <CardDescription>{req.student.classes?.name || 'Sınıfsız'}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                            Bekliyor
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Calendar className="w-4 h-4" />
                                            <span className="font-medium">
                                                {new Date(req.scheduled_at).toLocaleDateString('tr-TR', {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm italic border border-slate-100 dark:border-slate-800">
                                            "{req.topic}"
                                            {req.student_note && <div className="mt-1 text-xs text-slate-400">Not: {req.student_note}</div>}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleStatusUpdate(req.id, 'approved')}
                                                disabled={isUpdating}
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Onayla
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                                disabled={isUpdating}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reddet
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">
                        <Clock className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Bekleyen Talep Yok</h3>
                        <p className="text-slate-500">Şu anda onay bekleyen bir etüt talebi bulunmuyor.</p>
                    </div>
                )}
            </TabsContent>

            {/* PAST REQUESTS */}
            <TabsContent value="history" className="space-y-4">
                {pastRequests.map((req) => (
                    <Card key={req.id} className={`opacity-75 ${req.status === 'rejected' ? 'bg-red-50/30' : ''}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <div className="font-medium">{req.student.full_name}</div>
                                <Badge variant={req.status === 'rejected' ? 'destructive' : 'default'}>
                                    {(() => {
                                        if (req.status === 'approved') return 'Onaylandı';
                                        if (req.status === 'completed') return 'Tamamlandı';
                                        return 'Reddedildi';
                                    })()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>{new Date(req.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="italic truncate max-w-[200px]">{req.topic}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </TabsContent>
        </Tabs>
    );
}
