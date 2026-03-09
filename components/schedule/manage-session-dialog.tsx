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

interface ManageSessionDialogProps {
    session: StudySessionEvent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onClose: () => void
}

const SESSION_STATUS_LABELS: Record<string, string> = {
    available: 'Müsait (Talep Bekleniyor)',
    pending: 'Onay Bekliyor',
    approved: 'Onaylandı',
    completed: 'Tamamlandı',
    no_show: 'Gelmedi',
}

function getSessionStatusLabel(status: string): string {
    return SESSION_STATUS_LABELS[status] ?? status
}

async function executeSessionAction(
    action: () => Promise<{ error?: string } | null | undefined>,
    successMsg: string,
    setLoading: (v: boolean) => void,
    onClose: () => void
): Promise<void> {
    setLoading(true)
    try {
        const res = await action()
        if (res?.error) toast.error(res.error)
        else { toast.success(successMsg); onClose() }
    } catch { toast.error("Hata oluştu") }
    finally { setLoading(false) }
}

export function ManageSessionDialog({ session, open, onOpenChange, onClose }: Readonly<ManageSessionDialogProps>) { // NOSONAR
    const [loading, setLoading] = useState(false)
    const [students, setStudents] = useState<Profile[]>([])
    const [selectedStudentId, setSelectedStudentId] = useState<string>('')
    const [topic, setTopic] = useState<string>('')

    useEffect(() => {
        if (session?.status as string === 'available' && open) {
            getStudents({ limit: 100, classId: 'all' })
                .then((res: any) => {
                    let studentList: any[] = [];
                    if (res?.success && Array.isArray(res.data)) {
                        studentList = res.data;
                    } else if (res?.data?.success && Array.isArray(res.data.data)) {
                        studentList = res.data.data;
                    }
                    setStudents(studentList);
                })
                .catch((e) => {
                    console.error("Error fetching students:", e);
                    setStudents([]);
                });
        }
        if (!open) {
            setSelectedStudentId('')
            setTopic('')
        }
    }, [session?.status, open])

    if (!session) return null;

    const runAction = (action: () => Promise<{ error?: string } | null | undefined>, successMsg: string) =>
        executeSessionAction(action, successMsg, setLoading, onClose)

    const handleAssign = async () => {
        if (!selectedStudentId) {
            toast.error("Lütfen bir öğrenci seçin")
            return
        }
        return runAction(() => assignStudentToSession(session.id, selectedStudentId, topic), "Öğrenci başarıyla atandı")
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
                    {session.status as string === 'available' ? (
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
                                <span className="font-medium text-lg">{session.status as string === 'available' ? '-' : studentName}</span>
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
                        {session.status as string === 'available' && (
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


