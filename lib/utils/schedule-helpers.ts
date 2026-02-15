import { ScheduleEvent, StudySessionEvent } from '@/types/schedule'

export const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
// 08:00 - 21:00
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 8)
export const HOUR_HEIGHT = 100

export const getPosition = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number)
    const [h2, m2] = end.split(':').map(Number)
    const startOffset = (h1 - 8) * HOUR_HEIGHT + (m1 / 60) * HOUR_HEIGHT
    const duration = (((h2 * 60 + m2) - (h1 * 60 + m1)) / 60) * HOUR_HEIGHT
    return { top: startOffset, height: duration }
}

export const getStudySessionPosition = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    const h = date.getHours();
    const m = date.getMinutes();
    const startOffset = (h - 8) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
    const duration = 60 / 60 * HOUR_HEIGHT; // 1 hour fixed
    return { top: startOffset, height: duration }
}

export const getEventClasses = (
    event: ScheduleEvent | StudySessionEvent,
    isStudySession: boolean,
    currentUserId?: string,
    role?: 'admin' | 'teacher' | 'student'
) => {
    if (isStudySession) {
        const s = event as StudySessionEvent;
        const isMySession = currentUserId && s.student_id === currentUserId;

        if (s.status === 'available') {
            return {
                container: "bg-emerald-200 border-emerald-500 border-dashed",
                title: "text-emerald-800",
                subtitle: "text-emerald-800",
                icon: "text-emerald-800"
            }
        } else if (isMySession) {
            return {
                container: "bg-indigo-50 border-indigo-400 border-solid",
                title: "text-indigo-900",
                subtitle: "text-indigo-700",
                icon: "text-indigo-600"
            }
        } else {
            if (role === 'teacher') {
                if (s.status === 'pending') {
                    return {
                        container: "bg-amber-50 border-amber-400 border-solid",
                        title: "text-amber-900",
                        subtitle: "text-amber-700",
                        icon: "text-amber-600"
                    }
                }
                if (s.status === 'completed') {
                    return {
                        container: "bg-blue-100 border-blue-500 border-solid",
                        title: "text-blue-900",
                        subtitle: "text-blue-700",
                        icon: "text-blue-600"
                    }
                }
                if (s.status === 'no_show') {
                    return {
                        container: "bg-red-100 border-red-500 border-solid",
                        title: "text-red-900",
                        subtitle: "text-red-700",
                        icon: "text-red-600"
                    }
                }
                // Default typically means 'approved' (student booked)
                return {
                    container: "bg-purple-100 border-purple-500 border-solid",
                    title: "text-purple-900",
                    subtitle: "text-purple-700",
                    icon: "text-purple-600"
                }
            }
            return {
                container: "bg-slate-100 border-slate-300 border-solid",
                title: "text-slate-600",
                subtitle: "text-slate-500",
                icon: "text-slate-400"
            }
        }
    }

    // Regular Schedule Events (Classes)
    return {
        container: "bg-zinc-100 border-zinc-300 border-solid",
        title: "text-zinc-800",
        subtitle: "text-zinc-600",
        icon: "text-zinc-500"
    }
}
