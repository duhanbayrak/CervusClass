'use client'

import { useState } from "react"
import { WeeklyScheduler } from "./WeeklyScheduler";
import { ScheduleEvent, StudySessionEvent } from "@/types/schedule";
import { ManageSessionDialog } from "./manage-session-dialog"

interface TeacherScheduleClientProps {
    events: ScheduleEvent[]
    studySessions: StudySessionEvent[]
    currentUserId: string
}

export function TeacherScheduleClient({ events, studySessions, currentUserId }: TeacherScheduleClientProps) { // NOSONAR
    const [selectedSession, setSelectedSession] = useState<StudySessionEvent | null>(null)
    const [open, setOpen] = useState(false)

    const handleEventClick = (event: ScheduleEvent | StudySessionEvent) => {
        // Check if it is a study session
        if ('scheduled_at' in event) {
            setSelectedSession(event as StudySessionEvent) // NOSONAR
            setOpen(true)
        } else {
            // It's a regular schedule event.
            // Maybe open existing Edit Dialog?
            // For now, ignore or implement EditScheduleDialog logic here too if needed.
            // Assuming current requirement is focus on Study Session.

        }
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-md text-sm flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                <div className="mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                </div>
                <div>
                    <p className="font-medium">Etüt Slotu Oluşturma</p>
                    <p className="opacity-90">Takvimdeki boş alanlara tıklayarak öğrencileriniz için yeni etüt slotları oluşturabilirsiniz. Mobilde yatay kaydırarak diğer günleri görebilirsiniz.</p>
                </div>
            </div>

            <WeeklyScheduler
                events={events}
                studySessions={studySessions}
                role="teacher"
                currentUserId={currentUserId}
                onEventClick={handleEventClick}
            />

            <ManageSessionDialog
                open={open}
                onOpenChange={setOpen}
                session={selectedSession}
                onClose={() => setOpen(false)}
            />
        </div>
    )
}
