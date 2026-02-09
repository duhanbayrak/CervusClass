-- Drop the existing policy that uses the function causing recursion
DROP POLICY IF EXISTS "view_org_profiles" ON profiles;

-- Create a new policy for organization access
-- This relies on "Users can view own profile" being present to resolve the subquery for auth.uid()
CREATE POLICY "view_org_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);
