'use client'

import { useState } from "react"
import { ScheduleEvent, WeeklyScheduler, StudySessionEvent } from "./WeeklyScheduler"
import { ManageSessionDialog } from "./manage-session-dialog"

interface TeacherScheduleClientProps {
    events: ScheduleEvent[]
    studySessions: StudySessionEvent[]
    currentUserId: string
}

export function TeacherScheduleClient({ events, studySessions, currentUserId }: TeacherScheduleClientProps) {
    const [selectedSession, setSelectedSession] = useState<StudySessionEvent | null>(null)
    const [open, setOpen] = useState(false)

    const handleEventClick = (event: ScheduleEvent | StudySessionEvent) => {
        // Check if it is a study session
        if ('scheduled_at' in event) {
            setSelectedSession(event as StudySessionEvent)
            setOpen(true)
        } else {
            // It's a regular schedule event.
            // Maybe open existing Edit Dialog?
            // For now, ignore or implement EditScheduleDialog logic here too if needed.
            // Assuming current requirement is focus on Study Session.
            console.log("Clicked class event", event)
        }
    }

    return (
        <>
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
        </>
    )
}
