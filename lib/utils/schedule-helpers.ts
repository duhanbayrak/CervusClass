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
    // 1. Etüt Renkleri (Study Sessions)
    if (isStudySession) {
        const s = event as StudySessionEvent;
        // Öğrenci kendi oturumunu ayırt edebilsin (opsiyonel, şimdilik genel kurala uyduruyoruz ama border ile belirtebiliriz)
        const isMySession = currentUserId && s.student_id === currentUserId;

        switch (s.status) {
            case 'available': // Boş Slot
                return {
                    container: "bg-emerald-50 border-2 border-dashed border-emerald-400 opacity-90 hover:opacity-100",
                    title: "text-emerald-900 font-semibold",
                    subtitle: "text-emerald-700",
                    icon: "text-emerald-600"
                };

            case 'pending': // Onay Bekleyen (Alınmış ama net değil)
                return {
                    container: "bg-amber-100 border-l-4 border-amber-500 shadow-sm",
                    title: "text-amber-900 font-medium",
                    subtitle: "text-amber-700",
                    icon: "text-amber-600"
                };

            case 'approved': // Onaylanmış (Alınmış Etüt)
                return {
                    container: `bg-sky-100 border-l-4 border-sky-500 shadow-sm ${isMySession ? 'ring-2 ring-sky-300' : ''}`,
                    title: "text-sky-900 font-semibold",
                    subtitle: "text-sky-700",
                    icon: "text-sky-600"
                };

            case 'completed': // Tamamlanmış Etüt
                return {
                    container: "bg-gray-200 border-gray-400 border-solid opacity-80",
                    title: "text-gray-700 line-through decoration-gray-500",
                    subtitle: "text-gray-600",
                    icon: "text-gray-500"
                };

            case 'no_show': // Tamamlanmamış / Gelmedi
            case 'rejected':
            case 'cancelled':
                return {
                    container: "bg-red-100 border-l-4 border-red-500",
                    title: "text-red-900 font-bold",
                    subtitle: "text-red-700",
                    icon: "text-red-600"
                };

            default: // Varsayılan fallback
                return {
                    container: "bg-slate-100 border-slate-300",
                    title: "text-slate-700",
                    subtitle: "text-slate-500",
                    icon: "text-slate-400"
                };
        }
    }

    // 2. Normal Ders Renkleri (Schedule Events)
    // Ders programı verisi
    return {
        container: "bg-white border-l-4 border-indigo-500 shadow-sm hover:bg-indigo-50 transition-colors",
        title: "text-indigo-950 font-bold",
        subtitle: "text-indigo-700",
        icon: "text-indigo-400"
    };
}
