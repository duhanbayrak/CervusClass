-- Migration: Add selective student assignment to homework
-- Created: 2026-02-01
-- Description: Adds assigned_student_ids column to homework table to support
--              assigning homework to specific students instead of entire class

-- Add the new column
ALTER TABLE homework 
ADD COLUMN assigned_student_ids JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN homework.assigned_student_ids IS 
'Array of student profile IDs this homework is assigned to. NULL means assigned to entire class. Format: ["uuid1", "uuid2", ...]';

-- Add index for better query performance when filtering by student IDs
CREATE INDEX idx_homework_assigned_students ON homework USING GIN (assigned_student_ids);

-- Add index for common query pattern (class + student filtering)
CREATE INDEX idx_homework_class_students ON homework(class_id) 
WHERE assigned_student_ids IS NOT NULL;
