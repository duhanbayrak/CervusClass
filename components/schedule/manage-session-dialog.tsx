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
import { approveSession, cancelSession } from "@/lib/actions/study-session" // cancelSession can be used for Reject
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { StudySessionEvent } from "./WeeklyScheduler"

interface ManageSessionDialogProps {
    session: StudySessionEvent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onClose: () => void
}

export function ManageSessionDialog({ session, open, onOpenChange, onClose }: ManageSessionDialogProps) {
    const [loading, setLoading] = useState(false)
    console.log("ManageSessionDialog session prop:", session)

    if (!session) return null;

    const handleApprove = async () => {
        setLoading(true)
        try {
            const res = await approveSession(session.id)
            if (res.error) toast.error(res.error)
            else {
                toast.success("Talep onaylandı")
                onClose()
            }
        } catch (e) { toast.error("Hata oluştu") }
        finally { setLoading(false) }
    }

    const handleReject = async () => {
        if (!confirm("Bu talebi reddetmek/silmek istediğinize emin misiniz?")) return;
        setLoading(true)
        try {
            // For now we just delete/cancel. Ideally we might want a 'rejected' status.
            // We can implement rejectSession action later if needed, but cancelSession deletes it.
            // If we delete it, it's gone. 'Rejected' status is better for history.
            // But my action `cancelSession` deletes.
            // Let's use `cancelSession` for now (Teacher cancels availability or request).
            const res = await cancelSession(session.id)
            if (res.error) toast.error(res.error)
            else {
                toast.success("Talep silindi")
                onClose()
            }
        } catch (e) { toast.error("Hata oluştu") }
        finally { setLoading(false) }
    }

    const studentName = session.profiles?.full_name || "Öğrenci";
    const dateStr = session.scheduled_at ? new Date(session.scheduled_at).toLocaleString('tr-TR') : '';

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
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">Konu</span>
                            <span className="font-medium">{session.topic}</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Durum</span>
                        <span className="capitalize font-medium text-slate-900 border px-2 py-1 rounded w-fit text-sm">
                            {session.status === 'available' ? 'Müsait (Talep Bekleniyor)' :
                                session.status === 'pending' ? 'Onay Bekliyor' :
                                    session.status === 'approved' ? 'Onaylandı' : session.status}
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button variant="destructive" onClick={handleReject} disabled={loading}>
                        {session.status === 'available' ? 'Müsaitliği Sil' : 'Reddet/Sil'}
                    </Button>

                    {session.status === 'pending' && (
                        <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Onayla
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
