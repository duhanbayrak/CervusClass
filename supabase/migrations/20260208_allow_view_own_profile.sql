-- Allow users to view their own profile. 
-- This is critical for other policies that query the user's own profile (like organization checks) to work without infinite recursion.

CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);
