"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, X, Clock, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Assuming this exists, otherwise Input or standard textarea
import { Badge } from "@/components/ui/badge";
import { approveSession, rejectSession } from "@/lib/actions/study-session";

// StudySession tipi yerine any[] kullanılıyor — Supabase join sonucunda
// student ilişkisi (profiles!student_id) veritabanı tipinde tanımlı değil
interface StudyRequest {
    id: string;
    topic: string | null;
    scheduled_at: string;
    student?: { full_name: string; classes?: { name: string } };
    [key: string]: any;
}

interface PendingStudyRequestsListProps {
    requests: StudyRequest[];
}

export function PendingStudyRequestsList({ requests }: PendingStudyRequestsListProps) {
    const [processing, setProcessing] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const router = useRouter();

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            const res = await approveSession(id);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Etüt talebi onaylandı");
                router.refresh();
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        if (!rejectReason.trim()) {
            toast.error("Lütfen bir red sebebi giriniz");
            return;
        }

        setProcessing(selectedRequest);
        try {
            const res = await rejectSession(selectedRequest, rejectReason);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Etüt talebi reddedildi");
                setIsRejectOpen(false);
                setRejectReason("");
                router.refresh();
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setProcessing(null);
            setSelectedRequest(null);
        }
    };

    const openRejectDialog = (id: string) => {
        setSelectedRequest(id);
        setRejectReason("");
        setIsRejectOpen(true);
    };

    if (requests.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm">
                Bekleyen talep yok.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((req) => (
                <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-3"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-white">
                                {req.student?.full_name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                                    {req.student?.classes?.name || 'Sınıf ??'}
                                </Badge>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center justify-end text-xs font-medium text-slate-500 mb-1">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(req.scheduled_at), "d MMMM", { locale: tr })}
                            </div>
                            <div className="flex items-center justify-end text-xs font-bold text-slate-700 dark:text-slate-300">
                                <Clock className="w-3 h-3 mr-1" />
                                {format(new Date(req.scheduled_at), "HH:mm", { locale: tr })}
                            </div>
                        </div>
                    </div>

                    {/* Topic */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-700/50">
                        "{req.topic}"
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            disabled={!!processing}
                        >
                            {processing === req.id ? "İşleniyor..." : (
                                <>
                                    <Check className="w-4 h-4 mr-1.5" /> Onayla
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9"
                            size="sm"
                            onClick={() => openRejectDialog(req.id)}
                            disabled={!!processing}
                        >
                            <X className="w-4 h-4 mr-1.5" /> Reddet
                        </Button>
                    </div>
                </div>
            ))}

            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Talebi Reddet</DialogTitle>
                        <DialogDescription>
                            Bu etüt talebini neden reddediyorsunuz? Öğrenci bu açıklamayı görecektir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Örn: Bu saatte toplantım var, lütfen başka bir zamana talep oluştur."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>İptal</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
                            Reddet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
