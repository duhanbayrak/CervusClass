export type ProfileRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    subscription_status: 'active' | 'inactive' | 'past_due';
    created_at: string;
}

export interface Profile {
    id: string; // References auth.users(id)
    organization_id: string;
    role_id: string | null;
    roles?: {
        name: string;
    } | null;
    // role: ProfileRole; // Deprecated
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
    class_id: string | null;
    created_at: string;
    phone?: string | null;
    student_number?: string | null;
    parent_name?: string | null;
    parent_phone?: string | null;
    birth_date?: string | null;
    bio?: string | null;
    title?: string | null;
    start_date?: string | null;
}

export interface Class {
    id: string;
    organization_id: string;
    name: string;
    grade_level: number;
    created_at: string;
}

export interface Schedule {
    id: string;
    organization_id: string;
    class_id: string | null;
    teacher_id: string | null;
    course_name: string;
    day_of_week: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    start_time: string; // Time string like "14:30:00"
    end_time: string;
    created_at: string;
}

export type StudySessionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'no_show';

export interface StudySession {
    id: string;
    organization_id: string;
    teacher_id: string;
    student_id: string;
    scheduled_at: string; // ISO timestamp
    status_id: string;
    status_legacy?: string | null;
    study_session_statuses?: { name: string } | null;
    // status: StudySessionStatus; // Calculated from study_session_statuses.name in actions
    status?: string;
    topic: string | null;
    created_at: string;
}

export interface ExamResult {
    id: string;
    organization_id: string;
    student_id: string;
    exam_name: string;
    exam_date: string | null; // Date string like "2023-10-25"
    scores: Record<string, number>; // JSONB: {"mat": 20, "fiz": 5}
    total_net: number | null;
    created_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Attendance {
    id: string;
    organization_id: string;
    student_id: string;
    schedule_id: string | null;
    status: AttendanceStatus;
    date: string;
    late_minutes: number;
    created_at: string;
}

export interface Homework {
    id: string;
    organization_id: string;
    teacher_id: string;
    class_id: string;
    description: string;
    due_date: string | null;
    completion_status: Record<string, boolean>; // JSONB: { student_id: true }
    assigned_student_ids: string[] | null; // null = entire class, array = specific students
    created_at: string;
}
