-- Add end_time column to study_sessions table
ALTER TABLE public.study_sessions
ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;

-- Set a default end_time for existing study sessions (scheduled_at + 1 hour)
UPDATE public.study_sessions
SET end_time = scheduled_at + interval '1 hour'
WHERE end_time IS NULL;

-- Make end_time column NOT NULL after populating existing data
ALTER TABLE public.study_sessions
ALTER COLUMN end_time SET NOT NULL;
