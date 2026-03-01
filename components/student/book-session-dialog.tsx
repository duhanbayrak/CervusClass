'use client'

'use client'



import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { requestSession, getTeacherSchedule, getTeachers } from "@/lib/actions/study-session"
import { WeeklyScheduler } from "@/components/schedule/WeeklyScheduler"
import { ScheduleEvent, StudySessionEvent } from "@/types/schedule";
import { cn } from "@/lib/utils"

export function BookSessionDialog({ userId }: { userId: string }) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'select-teacher' | 'select-slot'>('select-teacher')

    // Data
    const [teachers, setTeachers] = useState<any[]>([])
    const [loadingTeachers, setLoadingTeachers] = useState(false)

    // Schedule Data
    const [loadingSchedule, setLoadingSchedule] = useState(false)
    const [events, setEvents] = useState<ScheduleEvent[]>([])
    const [studySessions, setStudySessions] = useState<StudySessionEvent[]>([])
    const [teacherName, setTeacherName] = useState("")

    // Booking
    const [selectedSession, setSelectedSession] = useState<StudySessionEvent | null>(null)
    const [topic, setTopic] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (open && step === 'select-teacher') {
            fetchTeachers()
        }
    }, [open, step])

    const fetchTeachers = async () => {
        setLoadingTeachers(true)

        try {
            const result = await getTeachers()


            if ('error' in result && result.error) {

                toast.error(result.error as string)
                setTeachers([])
            } else {
                const data = (result as any).data || []

                setTeachers(data)

                if (data.length === 0) {
                    toast.warning("Liste boş geldi (Hatasız)")
                }
            }
        } catch (e) {

            toast.error("Beklenmedik bir hata oluştu")
        } finally {
            setLoadingTeachers(false)
        }
    }

    const handleTeacherSelect = async (teacherId: string) => {
        setStep('select-slot')
        setLoadingSchedule(true)


        try {
            const data = await getTeacherSchedule(teacherId)

            if ((data as any).error) {
                toast.error(`Hata: ${(data as any).error}`)
            }

            setEvents(data.schedule as any || [])
            setStudySessions(data.sessions as any || [])
            setTeacherName(data.teacherName || "")

            if (!data.sessions || data.sessions.length === 0) {
                toast.info("Bu öğretmenin planlanmış, gelecek tarihli bir etütü bulunmuyor.")
            }
        } catch (e: any) {

            toast.error("Program yüklenemedi: " + e.message)
            setStep('select-teacher') // Go back on error
        } finally {
            setLoadingSchedule(false)
        }
    }

    const handleEventClick = (event: ScheduleEvent | StudySessionEvent) => {
        // Only allow clicking 'available' study sessions
        if ('scheduled_at' in event) {
            const session = event as StudySessionEvent
            if (session.status === 'available') {
                setSelectedSession(session)
            }
        }
    }

    const handleSubmit = async () => {
        if (!selectedSession || !topic) return;

        setSubmitting(true)
        try {
            const result = await requestSession(selectedSession.id, topic)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Talep gönderildi")
                setOpen(false)
                // Reset state
                setStep('select-teacher')
                setSelectedSession(null)
                setTopic("")
            }
        } catch (err) {
            toast.error("Bir hata oluştu")
        } finally {
            setSubmitting(false)
        }
    }

    const handleBack = () => {
        setStep('select-teacher')
        setSelectedSession(null)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#135bec] hover:bg-blue-700 text-white shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Talep Oluştur
                </Button>
            </DialogTrigger>
            <DialogContent className={cn("sm:max-w-[500px]", step === 'select-slot' && "sm:max-w-[1000px] h-[90vh]")}>
                <DialogHeader>
                    <DialogTitle>Etüt Talebi Oluştur</DialogTitle>
                    <DialogDescription>
                        {step === 'select-teacher' ? 'Talep oluşturmak istediğiniz öğretmeni seçin.' : `${teacherName} - Program`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 h-full overflow-hidden flex flex-col">
                    {step === 'select-teacher' && loadingTeachers && (
                        <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                    )}
                    {step === 'select-teacher' && !loadingTeachers && (
                        <div className="grid gap-2">
                            <Label>Öğretmen Seçin</Label>
                            <Select onValueChange={handleTeacherSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Öğretmen Ara..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {step !== 'select-teacher' && (
                        <div className="flex flex-col h-full gap-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Geri</Button>
                                <div className="text-sm text-muted-foreground flex-1 text-center">
                                    Yeşil renkli <strong>Müsait</strong> alanlara tıklayarak seçim yapın.
                                </div>
                            </div>

                            {loadingSchedule ? (
                                <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>
                            ) : (
                                <div
                                    className="flex-1 border rounded-md overflow-hidden min-h-0 relative"
                                    onClick={() => setSelectedSession(null)}
                                >
                                    <WeeklyScheduler
                                        events={events}
                                        studySessions={studySessions}
                                        role="student"
                                        currentUserId={userId}
                                        onEventClick={handleEventClick}
                                    />

                                    {/* Booking Popup/Overlay */}
                                    {selectedSession && (
                                        <div
                                            className="absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur border-t p-6 z-50 flex items-end gap-4 animate-in slide-in-from-bottom shadow-lg"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="font-semibold text-slate-700 dark:text-slate-200">Konu / Not</Label>
                                                <Input
                                                    value={topic}
                                                    onChange={e => setTopic(e.target.value)}
                                                    placeholder="Ne çalışmak istiyorsunuz?"
                                                    autoFocus
                                                    className="bg-white/50"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={!topic}
                                                isLoading={submitting}
                                                className="bg-slate-600 hover:bg-slate-700 text-white font-medium px-6"
                                            >
                                                Talep Gönder
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setSelectedSession(null)}
                                                className="text-slate-600 hover:bg-slate-100"
                                            >
                                                İptal
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
