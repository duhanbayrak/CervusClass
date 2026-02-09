-- Migration: Allow Admins to view homework submissions
-- Created: 2026-02-07
-- Description: Adds RLS policy for Admins and Super Admins to view all homework submissions
--              in their organization. This is required for the Teacher Profile page to
--              correctly calculate homework completion status.

CREATE POLICY "Admins can view all submissions in their org"
ON homework_submissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'super_admin'))
        AND organization_id = homework_submissions.organization_id
    )
);
