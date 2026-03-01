-- 20260211_secure_dashboard_rls.sql

-- 1. SCHEDULE (Ders Programı)
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_schedule" ON schedule;
CREATE POLICY "view_org_schedule" ON schedule
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 2. CLASSES (Sınıflar)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_classes" ON classes;
CREATE POLICY "view_org_classes" ON classes
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 3. COURSES (Dersler)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_courses" ON courses;
CREATE POLICY "view_org_courses" ON courses
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 4. HOMEWORK (Ödevler)
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_homework" ON homework;
CREATE POLICY "view_org_homework" ON homework
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "teacher_manage_own_homework" ON homework;
CREATE POLICY "teacher_manage_own_homework" ON homework
    FOR ALL
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());



-- 6. HOMEWORK_SUBMISSIONS (Ödev Teslimleri - Öğretmen görebilmeli)
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_homework_submissions_teacher" ON homework_submissions;
CREATE POLICY "view_homework_submissions_teacher" ON homework_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM homework 
            WHERE homework.id = homework_submissions.homework_id 
            AND homework.teacher_id = auth.uid()
        )
    );

-- 7. PROFILES (Ensure strict org visibility)
