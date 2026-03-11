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
import { approveSession, cancelSession, assignStudentToSession } from "@/lib/actions/study-session"
import { updateStudySessionStatus } from "@/lib/actions/study-session-admin"
import { getStudents } from "@/lib/actions/student"
import { Check, Ban } from "lucide-react"
import { useState, useEffect } from "react"

import { toast } from "sonner"
import { StudySessionEvent } from "@/types/schedule";
import { Profile } from "@/types/database"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"


const SESSION_STATUS_LABELS: Record<string, string> = {
    available: 'Müsait (Talep Bekleniyor)',
    pending: 'Onay Bekliyor',
    approved: 'Onaylandı',
    completed: 'Tamamlandı',
    no_show: 'Gelmedi',
    cancelled: 'İptal Edildi',
    rejected: 'Reddedildi',
}

function getSessionStatusLabel(status: string): string {
    return SESSION_STATUS_LABELS[status] ?? status
}

interface ManageSessionDialogProps {
    session: StudySessionEvent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onClose: () => void
}

export function ManageSessionDialog({ session, open, onOpenChange, onClose }: Readonly<ManageSessionDialogProps>) {
    const [loading, setLoading] = useState(false)
    const [students, setStudents] = useState<Profile[]>([])
    const [selectedStudentId, setSelectedStudentId] = useState<string>('')
    const [topic, setTopic] = useState<string>('')

    useEffect(() => {
        if (session?.status === 'available' && open) {
            getStudents({ page: 1, limit: 100 }).then(res => {
                if (res.success) setStudents((res.data as any).students ?? [])
            })
        }
        if (!open) {
            setSelectedStudentId('')
            setTopic('')
        }
    }, [session?.status, open])


    if (!session) return null;

    const handleAssign = async () => {
        if (!selectedStudentId) {
            toast.error("Lütfen bir öğrenci seçin")
            return
        }
        setLoading(true)
        try {
            const res = await assignStudentToSession(session.id, selectedStudentId, topic)
            if (res.error) toast.error(res.error)
            else {
                toast.success("Öğrenci başarıyla atandı")
                onClose()
            }
        } catch { toast.error("Hata oluştu") }
        finally { setLoading(false) }
    }

    const handleApprove = async () => {
        setLoading(true)
        try {
            const res = await approveSession(session.id)
            if (res.error) toast.error(res.error)
            else {
                toast.success("Talep onaylandı")
                onClose()
            }
        } catch { toast.error("Hata oluştu") }
        finally { setLoading(false) }
    }

    const handleReject = async () => {
        if (!confirm("Bu talebi reddetmek/silmek istediğinize emin misiniz?")) return;
        setLoading(true)
        try {
            const res = await cancelSession(session.id)
            if (res.error) toast.error(res.error)
            else {
                toast.success("Talep silindi")
                onClose()
            }
        } catch { toast.error("Hata oluştu") }
        finally { setLoading(false) }
    }

    const handleStatusUpdate = async (newStatus: 'completed' | 'no_show') => {
        setLoading(true)
        try {
            const res = await updateStudySessionStatus(session.id, newStatus)
            if (res?.error) toast.error(res.error)
            else {
                toast.success("Durum güncellendi")
                onClose()
            }
        } catch {
            toast.error("Hata oluştu")
        }
        finally { setLoading(false) }

    }

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
                    {session.status === 'available' ? (
                        <>
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium">Öğrenci Seçin</span>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Öğrenci seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium">Konu (Opsiyonel)</span>
                                <Input 
                                    placeholder="Etüt konusu" 
                                    value={topic} 
                                    onChange={(e) => setTopic(e.target.value)} 
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-muted-foreground">Öğrenci</span>
                                <span className="font-medium text-lg">{studentName}</span>
                            </div>

                            {session.topic && (
                                <div className="flex flex-col gap-1 w-full overflow-hidden">
                                    <span className="text-sm text-muted-foreground shrink-0">Konu</span>
                                    <span className="font-medium break-all whitespace-pre-wrap">{session.topic}</span>
                                </div>
                            )}
                        </>

                    )}

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Durum</span>
                        <span className="capitalize font-medium text-slate-900 border px-2 py-1 rounded w-fit text-sm">
                            {getSessionStatusLabel(session.status)}
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
                        {session.status === 'available' && (
                            <Button onClick={handleAssign} isLoading={loading} className="bg-primary hover:bg-primary/90">
                                Kaydet ve Ata
                            </Button>
                        )}

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


