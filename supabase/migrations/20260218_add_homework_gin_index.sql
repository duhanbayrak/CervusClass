-- Add GIN index to homework.assigned_student_ids for faster filtering
-- This optimizes the query: .or(`assigned_student_ids.cs."${user.id}"`)

CREATE INDEX IF NOT EXISTS idx_homework_assigned_student_ids ON homework USING GIN (assigned_student_ids);

-- Also add index for completion_status if we ever query by it (future proofing)
CREATE INDEX IF NOT EXISTS idx_homework_completion_status ON homework USING GIN (completion_status);
