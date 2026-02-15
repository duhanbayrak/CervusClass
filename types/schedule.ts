import { Schedule } from '@/types/database'

// Extended type with relations
export type ScheduleEvent = Schedule & {
    courses?: { name: string, code?: string }
    classes?: { name: string }
    profiles?: { full_name: string }
    room_name?: string
}

// Minimal type for Study Sessions to mix in
export interface StudySessionEvent {
    id: string
    scheduled_at: string // ISO string
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'no_show' | 'available'
    teacher_id: string
    student_id?: string | null
    topic?: string | null
    profiles?: { full_name: string } // Student info
}
