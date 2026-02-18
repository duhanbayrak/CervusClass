-- Add missing indexes on foreign keys to improve join and filter performance
-- Especially critical for RLS policies filtering by organization_id

-- 1. Organization ID Indexes (Critical for RLS)
CREATE INDEX IF NOT EXISTS idx_study_sessions_organization_id ON public.study_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_organization_id ON public.exam_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_organization_id ON public.attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_homework_organization_id ON public.homework(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_courses_organization_id ON public.courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_organization_id ON public.homework_submissions(organization_id);

-- 2. Other Foreign Key and Filter Indexes
CREATE INDEX IF NOT EXISTS idx_homework_submissions_student_id ON public.homework_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status_id ON public.study_sessions(status_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON public.profiles(class_id);

-- 3. Composite Indexes for potential bottlenecks
-- Attendance by schedule and date (used in upserts and checks)
CREATE INDEX IF NOT EXISTS idx_attendance_schedule_date ON public.attendance(schedule_id, date);

-- Exam results by student and exam (used in fetching specific results)
CREATE INDEX IF NOT EXISTS idx_exam_results_student_exam ON public.exam_results(student_id, exam_name);
