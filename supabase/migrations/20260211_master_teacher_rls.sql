-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- 20260211_master_teacher_rls.sql

-- 1. ATTENDANCE (Yoklama)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Clean legacy/conflicting policies
DROP POLICY IF EXISTS "view_org_attendance" ON attendance;
DROP POLICY IF EXISTS "teacher_insert_attendance" ON attendance;
DROP POLICY IF EXISTS "teacher_update_attendance" ON attendance;
DROP POLICY IF EXISTS "Teacher Attendance Insert" ON attendance;
DROP POLICY IF EXISTS "Teacher Attendance Update" ON attendance;
DROP POLICY IF EXISTS "teacher_manage_attendance" ON attendance; 
DROP POLICY IF EXISTS "admin_manage_attendance" ON attendance;

-- SELECT: Org based (Teacher sees records in their org)
CREATE POLICY "view_org_attendance" ON attendance
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);

-- INSERT: Teacher in Org (and Role is Teacher)
CREATE POLICY "teacher_insert_attendance" ON attendance
    FOR INSERT
    WITH CHECK (
        organization_id = (auth.jwt()->>'organization_id')::uuid
        AND (auth.jwt()->>'role') = 'teacher'
    );

-- UPDATE: Teacher in Org can update records in their org
CREATE POLICY "teacher_update_attendance" ON attendance
    FOR UPDATE
    USING (
        organization_id = (auth.jwt()->>'organization_id')::uuid
        AND (auth.jwt()->>'role') = 'teacher'
    )
    WITH CHECK (
        organization_id = (auth.jwt()->>'organization_id')::uuid
        AND (auth.jwt()->>'role') = 'teacher'
    );

-- 2. PROFILES (Öğrenci Listesi - Refreshing to be sure)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_profiles" ON profiles;
CREATE POLICY "view_org_profiles" ON profiles
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);

-- 3. SCHEDULE (Ders Programı)
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_schedule" ON schedule;
CREATE POLICY "view_org_schedule" ON schedule
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);

-- 4. CLASSES (Sınıflar)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_classes" ON classes;
CREATE POLICY "view_org_classes" ON classes
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);

-- 5. COURSES (Dersler)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_courses" ON courses;
CREATE POLICY "view_org_courses" ON courses
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);

-- 6. HOMEWORK (Ensuring consistency)
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_homework" ON homework;
CREATE POLICY "view_org_homework" ON homework
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);
