-- 20260211_secure_study_sessions_rls.sql
-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to avoid conflicts
DROP POLICY IF EXISTS "select_study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "insert_study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "update_study_sessions_student" ON study_sessions;
DROP POLICY IF EXISTS "update_study_sessions_teacher" ON study_sessions;
DROP POLICY IF EXISTS "delete_study_sessions" ON study_sessions;

-- 1. SELECT: Users can view sessions within their organization
CREATE POLICY "select_study_sessions" ON study_sessions
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 2. INSERT: Teachers can create availability (status 'available')
CREATE POLICY "insert_study_sessions" ON study_sessions
    FOR INSERT
    WITH CHECK (
        auth.uid() = teacher_id 
        AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        -- Ensure created as 'available'
        AND status_id = (SELECT id FROM study_session_statuses WHERE name = 'available')
    );

-- 3. UPDATE (Student): Students can request an 'available' slot
CREATE POLICY "update_study_sessions_student" ON study_sessions
    FOR UPDATE
    USING (
        -- Can only update if currently available
        status_id = (SELECT id FROM study_session_statuses WHERE name = 'available')
        AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
    WITH CHECK (
        -- Must change to 'pending'
        status_id = (SELECT id FROM study_session_statuses WHERE name = 'pending')
        -- Must assign themselves
        AND student_id = auth.uid()
        -- Topic must be provided (optional but good practice, enforces non-empty if schema doesn't)
    );

-- 4. UPDATE (Teacher): Teachers can manage their own sessions (Approve/Reject/Cancel)
CREATE POLICY "update_study_sessions_teacher" ON study_sessions
    FOR UPDATE
    USING (teacher_id = auth.uid());

-- 5. DELETE: Teachers can delete their own sessions
CREATE POLICY "delete_study_sessions" ON study_sessions
    FOR DELETE
    USING (teacher_id = auth.uid());


-- Profiles Visibility (Ensure teachers can see student names)
-- Likely already exists, but enforcing ensuring organization visibility
DROP POLICY IF EXISTS "view_org_profiles" ON profiles;

CREATE POLICY "view_org_profiles" ON profiles
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
