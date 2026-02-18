-- Performance Indexes for Scalability
-- Created based on SCALABILITY_ANALYSIS.md report
-- REVISION: Removed non-existent exam_id index, added exam_name and exam_date indexes

-- 1. Foreign Key and Filter Indexes
-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_schedule_id ON public.attendance(schedule_id);

-- Exam Results
-- exam_id column does not exist, grouping is done via exam_name and date
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_name ON public.exam_results(exam_name);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_date ON public.exam_results(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);

-- Homework
CREATE INDEX IF NOT EXISTS idx_homework_class_id ON public.homework(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher_id ON public.homework(teacher_id);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON public.profiles(class_id);

-- Schedule
CREATE INDEX IF NOT EXISTS idx_schedule_class_id ON public.schedule(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_teacher_id ON public.schedule(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_course_id ON public.schedule(course_id);

-- Study Sessions
CREATE INDEX IF NOT EXISTS idx_study_sessions_student_id ON public.study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_teacher_id ON public.study_sessions(teacher_id);

-- 2. JSONB Index for Homework Assignments (GIN Index for array containment operations)
CREATE INDEX IF NOT EXISTS idx_homework_assigned_student_ids ON public.homework USING GIN (assigned_student_ids);

-- 3. Unique Constraint for Attendance (Ensures upsert reliability and prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_entry ON public.attendance(student_id, schedule_id, date);
