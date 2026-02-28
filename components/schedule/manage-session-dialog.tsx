'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { approveSession, cancelSession } from "@/lib/actions/study-session"
import { updateStudySessionStatus } from "@/lib/actions/study-session-admin"
import { Check, Ban } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { StudySessionEvent } from "@/types/schedule";

interface ManageSessionDialogProps {
    session: StudySessionEvent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onClose: () => void
}

export function ManageSessionDialog({ session, open, onOpenChange, onClose }: ManageSessionDialogProps) {
    const [loading, setLoading] = useState(false)

    if (!session) return null;

    const runAction = async (action: () => Promise<{ error?: string } | null | undefined>, successMsg: string) => {
        setLoading(true)
        try {
            const res = await action()
            if (res?.error) toast.error(res.error)
            else { toast.success(successMsg); onClose() }
        } catch { toast.error("Hata oluştu") }
        finally { setLoading(false) }
    }

    const handleApprove = () => runAction(() => approveSession(session.id), "Talep onaylandı")
    const handleReject = () => {
        if (!confirm("Bu talebi reddetmek/silmek istediğinize emin misiniz?")) return Promise.resolve()
        return runAction(() => cancelSession(session.id), "Talep silindi")
    }
    const handleStatusUpdate = (newStatus: 'completed' | 'no_show') =>
        runAction(() => updateStudySessionStatus(session.id, newStatus), "Durum güncellendi")

    const studentName = session.profiles?.full_name || "Öğrenci";
    const dateStr = session.scheduled_at ? new Date(session.scheduled_at).toLocaleString('tr-TR') : '';

    const isPast = session.scheduled_at ? new Date(session.scheduled_at) < new Date() : false;
    const isApprovable = session.status === 'pending';
    const isActionable = session.status === 'approved' && isPast;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Etüt Yönetimi</DialogTitle>
                    <DialogDescription>
                        {dateStr}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Öğrenci</span>
                        <span className="font-medium text-lg">{session.status === 'available' ? '-' : studentName}</span>
                    </div>

                    {session.topic && (
                        <div className="flex flex-col gap-1 w-full overflow-hidden">
                            <span className="text-sm text-muted-foreground shrink-0">Konu</span>
                            <span className="font-medium break-all whitespace-pre-wrap">{session.topic}</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Durum</span>
                        <span className="capitalize font-medium text-slate-900 border px-2 py-1 rounded w-fit text-sm">
                            {session.status === 'available' ? 'Müsait (Talep Bekleniyor)' :
                                session.status === 'pending' ? 'Onay Bekliyor' :
                                    session.status === 'approved' ? 'Onaylandı' :
                                        session.status === 'completed' ? 'Tamamlandı' :
                                            session.status === 'no_show' ? 'Gelmedi' :
                                                session.status}
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-between">
                    {/* Left Side: Reject/Delete (Always available except completed/noshow maybe?) */}
                    {session.status !== 'completed' && session.status !== 'no_show' && (
                        <Button variant="destructive" onClick={handleReject} isLoading={loading} size="sm">
                            Reddet/Sil
                        </Button>
                    )}

                    <div className="flex gap-2 justify-end w-full sm:w-auto">
                        {isApprovable && (
                            <Button onClick={handleApprove} isLoading={loading} className="bg-green-600 hover:bg-green-700">
                                Onayla
                            </Button>
                        )}

                        {isActionable && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => handleStatusUpdate('no_show')}
                                    isLoading={loading}
                                    className="text-red-600 hover:bg-red-50 border-red-200"
                                >
                                    <Ban className="mr-2 h-4 w-4" /> Gelmedi
                                </Button>
                                <Button
                                    onClick={() => handleStatusUpdate('completed')}
                                    isLoading={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Check className="mr-2 h-4 w-4" /> Tamamlandı
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


