-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files

-- Create Enum for Status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE homework_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create homework_submissions table
CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    homework_id UUID REFERENCES homework(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    status homework_status DEFAULT 'pending',
    teacher_feedback TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(homework_id, student_id)
);

-- RLS Policies
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Organization Isolation (Base rule for everyone)
-- All subsequent policies should logically imply this, but it's good practice.

-- Policy 2: Teachers/Admins can do EVERYTHING for their organization
CREATE POLICY "Teachers and Admins can manage submissions in their org"
ON homework_submissions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = homework_submissions.organization_id
        AND (
            profiles.role_id IN (SELECT id FROM roles WHERE name IN ('teacher', 'admin', 'super_admin'))
        )
    )
);

-- Policy 3: Students can VIEW their own submissions
CREATE POLICY "Students can view their own submissions"
ON homework_submissions
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);

-- Policy 4: Students can UPDATE (Submit) their own submissions
-- Limit: Only change status to 'submitted' if current is 'pending' or 'rejected'.
-- Limit: Cannot change 'approved' status.
CREATE POLICY "Students can submit their own homework"
ON homework_submissions
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()
    AND status IN ('pending', 'rejected') -- strict logic
)
WITH CHECK (
    student_id = auth.uid()
    AND status = 'submitted' -- can only switch TO submitted
);
