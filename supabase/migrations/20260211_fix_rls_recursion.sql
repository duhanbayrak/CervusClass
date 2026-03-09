-- NOSONAR
-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- 20260211_fix_rls_recursion.sql

-- Fix recursion in profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_org_profiles" ON profiles;
CREATE POLICY "view_org_profiles" ON profiles
    FOR SELECT -- NOSONAR
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);


-- Optimize other tables to use JWT (Consistency & Performance)

-- 1. SCHEDULE
DROP POLICY IF EXISTS "view_org_schedule" ON schedule;
CREATE POLICY "view_org_schedule" ON schedule
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);

-- 2. CLASSES
DROP POLICY IF EXISTS "view_org_classes" ON classes;
CREATE POLICY "view_org_classes" ON classes
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);

-- 3. COURSES
DROP POLICY IF EXISTS "view_org_courses" ON courses;
CREATE POLICY "view_org_courses" ON courses
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);

-- 4. HOMEWORK
DROP POLICY IF EXISTS "view_org_homework" ON homework;
CREATE POLICY "view_org_homework" ON homework
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);
    
-- 5. STUDY_SESSIONS
DROP POLICY IF EXISTS "select_study_sessions" ON study_sessions;
CREATE POLICY "select_study_sessions" ON study_sessions
    FOR SELECT
    USING (organization_id = (auth.jwt()->>'organization_id')::uuid);
    
-- 6. STUDENT_CLASSES
-- (Assuming table exists or skipping if it really doesn't, but assuming profiles.class_id based on previous findings. 
-- Wait, previous finding was student_classes DOES NOT EXIST. So skipping.)
