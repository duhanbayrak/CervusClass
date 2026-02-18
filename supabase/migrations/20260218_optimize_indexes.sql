-- Optimizing Foreign Key Indexes for Join Performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_homework_id ON homework_submissions(homework_id);
CREATE INDEX IF NOT EXISTS idx_schedule_organization_id ON schedule(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_organization_id ON branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_courses_branch_id ON courses(branch_id);

-- Partial Indexes for Soft Delete Performance
-- We index organization_id + deleted_at logic to speed up the most common access pattern:
-- "Show me active items for this organization"
CREATE INDEX IF NOT EXISTS idx_classes_active_org ON classes(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_schedule_active_org ON schedule(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_homework_active_org ON homework(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exam_results_active_org ON exam_results(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_active_org ON profiles(organization_id) WHERE deleted_at IS NULL;

-- Composite Index for Schedule Time Lookups (High Traffic: Dashboard/Calendar)
-- Speeds up "Find schedule for org X on Day Y between Start and End"
CREATE INDEX IF NOT EXISTS idx_schedule_lookup 
ON schedule(organization_id, day_of_week) 
WHERE deleted_at IS NULL;
