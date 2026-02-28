-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- 20260211_fix_rls_json_path.sql

-- Helper to make policies readable (Optional, but clean)
-- We will write inline to be explicit and avoid function dependencies if possible.
-- Path: auth.jwt() -> 'app_metadata' -> 'organization_id'

-- 1. SCHEDULE
DROP POLICY IF EXISTS "view_org_schedule" ON schedule;
CREATE POLICY "view_org_schedule" ON schedule
    FOR SELECT
    USING (organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid));

-- 2. CLASSES
DROP POLICY IF EXISTS "view_org_classes" ON classes;
CREATE POLICY "view_org_classes" ON classes
    FOR SELECT
    USING (organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid));

-- 3. COURSES
DROP POLICY IF EXISTS "view_org_courses" ON courses;
CREATE POLICY "view_org_courses" ON courses
    FOR SELECT
    USING (organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid));

-- 4. HOMEWORK
DROP POLICY IF EXISTS "view_org_homework" ON homework;
CREATE POLICY "view_org_homework" ON homework
    FOR SELECT
    USING (organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid));

DROP POLICY IF EXISTS "teacher_manage_own_homework" ON homework;
CREATE POLICY "teacher_manage_own_homework" ON homework
    FOR ALL
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

-- 5. ATTENDANCE
DROP POLICY IF EXISTS "view_org_attendance" ON attendance;
CREATE POLICY "view_org_attendance" ON attendance
    FOR SELECT
    USING (organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid));

DROP POLICY IF EXISTS "teacher_insert_attendance" ON attendance;
CREATE POLICY "teacher_insert_attendance" ON attendance
    FOR INSERT
    WITH CHECK (
        organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
        AND ((auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher')
    );

DROP POLICY IF EXISTS "teacher_update_attendance" ON attendance;
CREATE POLICY "teacher_update_attendance" ON attendance
    FOR UPDATE
    USING (
        organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
        AND ((auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher')
    )
    WITH CHECK (
        organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
        AND ((auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher')
    );

-- 6. PROFILES
DROP POLICY IF EXISTS "view_org_profiles" ON profiles;
CREATE POLICY "view_org_profiles" ON profiles
    FOR SELECT
    USING (organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid));

-- 7. STUDY SESSIONS
DROP POLICY IF EXISTS "select_study_sessions" ON study_sessions;
CREATE POLICY "select_study_sessions" ON study_sessions
    FOR SELECT
    USING (organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid));

DROP POLICY IF EXISTS "insert_study_sessions" ON study_sessions;
CREATE POLICY "insert_study_sessions" ON study_sessions
    FOR INSERT
    WITH CHECK (
        auth.uid() = teacher_id 
        AND organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
        AND status_id = (SELECT id FROM study_session_statuses WHERE name = 'available')
    );

DROP POLICY IF EXISTS "update_study_sessions_student" ON study_sessions;
CREATE POLICY "update_study_sessions_student" ON study_sessions
    FOR UPDATE
    USING (
        status_id = (SELECT id FROM study_session_statuses WHERE name = 'available')
        AND organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
    )
    WITH CHECK (
        status_id = (SELECT id FROM study_session_statuses WHERE name = 'pending')
        AND student_id = auth.uid()
    );
