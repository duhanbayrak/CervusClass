'use client'



import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,

    // NOSONAR
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
import { getStudentClasses } from "@/lib/actions/student-schedule"
import { WeeklyScheduler } from "@/components/schedule/WeeklyScheduler"
import { ScheduleEvent, StudySessionEvent } from "@/types/schedule";
// @ts-ignore
import { cn } from "@/lib/utils"

export function BookSessionDialog({ userId }: Readonly<{ userId: string }>) {
    // NOSONAR
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
    const [selectedSessions, setSelectedSessions] = useState<StudySessionEvent[]>([])
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

                toast.error(result.error)
                // NOSONAR
                setTeachers([])
            } else {
                const data = (result as any).data || []

                setTeachers(data)

                if (data.length === 0) {
                    toast.warning("Liste boş geldi (Hatasız)")
                }
            }
        } catch (e) { // NOSONAR
            console.error('Error fetching teachers:', e);
            toast.error("Beklenmedik bir hata oluştu")
        } finally {
            setLoadingTeachers(false)
        }
    }

    const handleTeacherSelect = async (teacherId: string) => {
        setStep('select-slot')
        setLoadingSchedule(true)

        try {
            // Mevcut öğretmenin programını ve etütlerini çek
            const data = await getTeacherSchedule(teacherId)

            // Ayrıca öğrencinin kendi ders programını çek
            const studentSchedule = await getStudentClasses()

            if ((data as any).error) {
                toast.error(`Hata: ${(data as any).error}`)
            }
            if ((studentSchedule as any).error) {
                toast.error(`Öğrenci programı çekilemedi: ${(studentSchedule as any).error}`)
            }

            // Etkinlikleri birleştir: Öğretmenin dersleri + Öğrencinin dersleri
            setEvents([...(data.schedule as any || []), ...(studentSchedule.schedule as any || [])])
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
            
            // Çakışma kontrolü Frontend tarafında (öğretmenin veya öğrencinin dersi varsa engelle)
            const sessionStart = new Date(session.scheduled_at).getTime()
            const sessionEnd = new Date(session.end_time || sessionStart + 60*60*1000).getTime()
            const dayOfWeek = new Date(session.scheduled_at).getDay() || 7

            const hasConflict = events.some(e => {
                if (e.day_of_week !== dayOfWeek) return false;
                const eStart = new Date(`${session.scheduled_at.split('T')[0]}T${e.start_time}+03:00`).getTime();
                const eEnd = new Date(`${session.scheduled_at.split('T')[0]}T${e.end_time}+03:00`).getTime();
                return sessionStart < eEnd && sessionEnd > eStart;
            })

            if (hasConflict) {
                toast.error("Bu saatte dersiniz olduğu için etüt seçemezsiniz.")
                return;
            }
            if (session.status === 'available') {
                setSelectedSessions(prev => {
                    const isSelected = prev.find(s => s.id === session.id)
                    if (isSelected) {
                        return prev.filter(s => s.id !== session.id)
                    } else {
                        return [...prev, session]
                    }
                })
            }
        }
    }

    const handleSubmit = async () => {
        if (selectedSessions.length === 0 || !topic) return;

        setSubmitting(true)
        try {
            const promises = selectedSessions.map(session => requestSession(session.id, topic))
            const results = await Promise.all(promises)
            
            const hasError = results.some(r => r.error)
            
            if (hasError) {
                const firstError = results.find(r => r.error)?.error
                toast.error(firstError)
            } else {
                toast.success(`${selectedSessions.length} etüt talebi gönderildi.`)
                setOpen(false)
                // Reset state
                setStep('select-teacher')
                setSelectedSessions([])
                setTopic("")
            }
        } catch (err) { // NOSONAR
            console.error('Error submitting session request:', err);
            toast.error("Bir hata oluştu")
        } finally {
            setSubmitting(false)
        }
    }

    const handleBack = () => {
        setStep('select-teacher')
        setSelectedSessions([])
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
                                    className="flex-1 border rounded-md overflow-hidden min-h-0 relative bg-white dark:bg-slate-950"
                                    onClick={() => setSelectedSessions([])}
                                >
                                    <WeeklyScheduler
                                        events={events} // Hem öğretmenin hem öğrencinin derslerini içerir
                                        studySessions={studySessions}
                                        role="student"
                                        currentUserId={userId}
                                        onEventClick={handleEventClick}
                                        selectedSessionIds={selectedSessions.map(s => s.id)}
                                    />

                                    {/* Booking Popup/Overlay */}
                                    {selectedSessions.length > 0 && (
                                        <div
                                            className="absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur border-t p-6 z-50 flex items-end gap-4 animate-in slide-in-from-bottom shadow-lg"
                                        >
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="font-semibold text-slate-700 dark:text-slate-200">Konu / Not ({selectedSessions.length} Etüt Seçildi)</Label>
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
                                                disabled={!topic || submitting}
                                                className="bg-slate-600 hover:bg-slate-700 text-white font-medium px-6"
                                            >
                                                {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                                Talep Gönder
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setSelectedSessions([])}
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
