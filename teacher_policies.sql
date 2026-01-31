-- Homework Table Policies

-- Allow teachers to insert homework where they are the assignee (teacher_id)
CREATE POLICY "Teachers can create homework"
ON public.homework
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = teacher_id
);

-- Allow teachers to update their own homework
CREATE POLICY "Teachers can update their own homework"
ON public.homework
FOR UPDATE
TO authenticated
USING (
  auth.uid() = teacher_id
)
WITH CHECK (
  auth.uid() = teacher_id
);

-- Allow teachers to delete their own homework
CREATE POLICY "Teachers can delete their own homework"
ON public.homework
FOR DELETE
TO authenticated
USING (
  auth.uid() = teacher_id
);

-- Study Sessions Table Policies

-- Allow teachers to update study sessions assigned to them (e.g. status change)
CREATE POLICY "Teachers can update their study sessions"
ON public.study_sessions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = teacher_id
)
WITH CHECK (
  auth.uid() = teacher_id
);
