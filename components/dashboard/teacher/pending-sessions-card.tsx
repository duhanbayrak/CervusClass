"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, AlertCircle } from "lucide-react";
import { getPendingPastSessions } from "@/lib/actions/study-session";
import { updateStudySessionStatus } from "@/lib/actions/study-session-admin";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";

export function PendingSessionsCard() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const router = useRouter();

    const fetchSessions = async () => {
        setLoading(true);
        const res = await getPendingPastSessions();
        if (res.data) {
            setSessions(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleAction = async (sessionId: string, status: 'completed' | 'no_show') => {
        setProcessing(sessionId);
        try {
            const res = await updateStudySessionStatus(sessionId, status);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success(status === 'completed' ? "Etüt tamamlandı" : "Gelmedi olarak işaretlendi");
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                router.refresh();
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu");
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return null;
    if (sessions.length === 0) return null;

    return (
        <Card className="border-amber-200 bg-amber-50/50 mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-amber-900 flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    İşlem Bekleyen Etütler
                    <span className="ml-auto text-xs font-normal bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                        {sessions.length} Bekleyen
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div key={session.id} className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
                            <div className="flex-1">
                                <div className="font-medium text-amber-950">
                                    {session.profiles?.full_name || 'Öğrenci Bilgisi Yok'}
                                </div>
                                <div className="text-sm text-amber-800/80 flex gap-2 mt-0.5">
                                    <span>{format(new Date(session.scheduled_at), "d MMMM, HH:mm", { locale: tr })}</span>
                                    <span>•</span>
                                    <span>{session.topic || 'Konu Belirtilmemiş'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 border-dashed"
                                    onClick={() => handleAction(session.id, 'no_show')}
                                    disabled={loading || processing === session.id}
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Gelmedi
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleAction(session.id, 'completed')}
                                    disabled={loading || processing === session.id}
                                >
                                    <Check className="w-4 h-4 mr-1" />
                                    Geldi (Tamamla)
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
