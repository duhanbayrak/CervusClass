-- Migration: Add UPDATE policies for study_sessions (Corrected for role_id)
-- Created by: Agent
-- Date: 2026-02-07

-- Policy for Teachers: Can update only their own sessions
CREATE POLICY "Teachers can update their own sessions"
ON study_sessions FOR UPDATE
USING (
  auth.uid() = teacher_id
);

-- Policy for Admins: Can update any session in their organization
CREATE POLICY "Admins can update org sessions"
ON study_sessions FOR UPDATE
USING (
   EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'super_admin'))
        AND organization_id = study_sessions.organization_id
    )
);

-- Students request (INSERT):
CREATE POLICY "Students can request sessions"
ON study_sessions FOR INSERT
WITH CHECK (
  auth.uid() = student_id
);

-- Teachers insert availability (INSERT):
CREATE POLICY "Teachers can create availability"
ON study_sessions FOR INSERT
WITH CHECK (
  auth.uid() = teacher_id 
);
