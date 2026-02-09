-- Migration: Remove unused columns from homework table
-- Created: 2026-02-07
-- Description: Removes completion_status and target_students columns which are no longer used.
--              completion_status superseded by homework_submissions table.
--              target_students superseded by assigned_student_ids column.

-- Drop completion_status column
ALTER TABLE homework 
DROP COLUMN IF EXISTS completion_status;

-- Drop target_students column
ALTER TABLE homework 
DROP COLUMN IF EXISTS target_students;
