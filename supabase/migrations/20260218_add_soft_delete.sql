-- Add 'deleted_at' column for Soft Delete pattern

-- 1. Add columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.schedule ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add Indexes for performance (since almost all queries will filter by this)
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_classes_deleted_at ON public.classes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_schedule_deleted_at ON public.schedule(deleted_at);
CREATE INDEX IF NOT EXISTS idx_exams_deleted_at ON public.exams(deleted_at);
CREATE INDEX IF NOT EXISTS idx_homework_deleted_at ON public.homework(deleted_at);

-- 3. Create a helper function to easily soft delete rows
-- This is optional but useful for RLS or future RPC usage
CREATE OR REPLACE FUNCTION public.soft_delete_record(_table_name text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE format('UPDATE public.%I SET deleted_at = NOW() WHERE id = $1', _table_name) USING _id;
END;
$$;
