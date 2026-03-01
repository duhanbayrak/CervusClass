-- NOSONAR\n-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Create ENUM for submission status
CREATE TYPE submission_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');

-- Create homework_submissions table
CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homework_id UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status submission_status DEFAULT 'pending',
    submitted_at TIMESTAMPTZ,
    teacher_feedback TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one submission per student per homework
    UNIQUE(homework_id, student_id)
);

-- Enable RLS
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Student can see their own submissions
CREATE POLICY "Students can view their own submissions"
    ON homework_submissions FOR SELECT
    USING (auth.uid() = student_id);

-- 2. Student can update their own submission (submit)
CREATE POLICY "Students can update their own submissions"
    ON homework_submissions FOR UPDATE
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- 3. Teachers can view submissions for homework they created
-- This requires a join or ensuring teacher's organization matches.
-- Basic rule: Teachers in same organization can view/manage.
CREATE POLICY "Teachers can view all submissions in their org"
    ON homework_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role_id = (SELECT id FROM roles WHERE name = 'teacher')
            AND organization_id = homework_submissions.organization_id
        )
    );

-- 4. Teachers can update submissions (approve/reject)
CREATE POLICY "Teachers can update submissions in their org"
    ON homework_submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role_id = (SELECT id FROM roles WHERE name = 'teacher')
            AND organization_id = homework_submissions.organization_id
        )
    );
    
-- 5. Teachers can insert submissions (when creating homework)
CREATE POLICY "Teachers can insert submissions"
    ON homework_submissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role_id = (SELECT id FROM roles WHERE name = 'teacher')
            AND organization_id = homework_submissions.organization_id
        )
    );

-- Function to mark overdue homeworks
CREATE OR REPLACE FUNCTION mark_overdue_homeworks()
RETURNS void AS $$
BEGIN
    UPDATE homework_submissions hs
    SET status = 'rejected'
    FROM homework h
    WHERE hs.homework_id = h.id
    AND hs.status = 'pending'
    AND h.due_date < NOW();
END;
$$ LANGUAGE plpgsql;
