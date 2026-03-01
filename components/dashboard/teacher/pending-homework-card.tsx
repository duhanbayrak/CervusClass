"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ClipboardList } from "lucide-react";
import { assessHomework } from "@/lib/actions/teacher-homework";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PendingHomeworkCardProps {
    initialHomeworks: any[];
}

export function PendingHomeworkCard({ initialHomeworks }: PendingHomeworkCardProps) { // NOSONAR
    const [homeworks, setHomeworks] = useState<any[]>(initialHomeworks);
    const [processing, setProcessing] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState("");
    const [isRevisionRequired, setIsRevisionRequired] = useState(false);
    const router = useRouter();

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            const result = await assessHomework({ submissionId: id, status: 'approved' });
            if (result.success) {
                toast({
                    title: "Başarılı",
                    description: "Ödev onaylandı",
                    className: "bg-green-50 border-green-200"
                });
                setHomeworks(prev => prev.filter(h => h.id !== id));
                router.refresh();
            } else {
                toast({
                    title: "Hata",
                    description: "İşlem başarısız oldu",
                    variant: "destructive"
                });
            }
        } catch (error) { // NOSONAR
            toast({
                title: "Hata",
                description: "Bir hata oluştu",
                variant: "destructive"
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        setProcessing(rejectId);
        try {
            const status = isRevisionRequired ? 'pending' : 'rejected';
            const result = await assessHomework({ submissionId: rejectId, status, feedback });
            if (result.success) {
                toast({
                    title: status === 'pending' ? "Revizyon İstendi" : "Reddedildi",
                    description: status === 'pending' ? "Öğrenciye revizyon talebi iletildi" : "Ödev reddedildi ve notunuz iletildi",
                    variant: "default"
                });
                setHomeworks(prev => prev.filter(h => h.id !== rejectId));
                setRejectId(null);
                setFeedback("");
                setIsRevisionRequired(false);
                router.refresh();
            } else {
                toast({
                    title: "Hata",
                    description: "İşlem başarısız oldu",
                    variant: "destructive"
                });
            }
        } catch (error) { // NOSONAR
            toast({
                title: "Hata",
                description: "Bir hata oluştu",
                variant: "destructive"
            });
        } finally {
            setProcessing(null);
        }
    };

    if (homeworks.length === 0) return null;

    return (
        <>
            <Card className="border-blue-200 bg-blue-50/50 mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                        Onay Bekleyen Ödevler
                        <span className="ml-auto text-xs font-normal bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {homeworks.length} Bekleyen
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {homeworks.map((hw) => (
                            <div key={hw.id} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-blue-950">
                                        {hw.student?.full_name || 'Öğrenci Bilgisi Yok'}
                                    </div>
                                    <div className="text-sm text-blue-800/80 flex flex-wrap gap-2 mt-0.5">
                                        <span className="font-medium">{hw.homework?.description}</span>
                                        <span className="text-blue-300">•</span>
                                        <span>{format(new Date(hw.submitted_at), "d MMMM, HH:mm", { locale: tr })}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 border-dashed"
                                        onClick={() => setRejectId(hw.id)}
                                        disabled={!!processing}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Reddet
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleApprove(hw.id)}
                                        isLoading={processing === hw.id}
                                    >
                                        {!processing && <Check className="w-4 h-4 mr-1" />}
                                        Onayla
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!rejectId} onOpenChange={(open) => {
                if (!open) {
                    setRejectId(null);
                    setIsRevisionRequired(false);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ödevi Reddet / Revizyon İste</DialogTitle>
                        <DialogDescription>
                            Öğrenciye iletilmek üzere bir red sebebi veya düzeltme notu giriniz.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="feedback">Öğretmen Görüşü (Zorunlu)</Label>
                            <Textarea
                                id="feedback"
                                placeholder="Reddetme veya revizyon nedenini açıklayınız..."
                                className="min-h-[100px]"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="revision"
                                checked={isRevisionRequired}
                                onCheckedChange={(checked) => setIsRevisionRequired(!!checked)}
                            />
                            <Label htmlFor="revision" className="font-medium text-slate-700 cursor-pointer">
                                Revizyon İste (Öğrenciye Tekrar Ata)
                            </Label>
                        </div>
                        <p className="text-xs text-slate-500">
                            İşaretlenirse ödev durumu "Bekliyor" olur ve öğrenci tekrar gönderim yapabilir.
                            İşaretlenmezse "Reddedildi" olarak işaretlenir.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRejectId(null)}>İptal</Button>
                        <Button variant="destructive" onClick={handleReject} isLoading={!!processing}>
                            İşlemi Tamamla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
