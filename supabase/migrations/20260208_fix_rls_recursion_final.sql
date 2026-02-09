-- Create a safe, security definer function to get the current user's organization ID
-- This bypasses RLS to avoid recursion when used in policies.
CREATE OR REPLACE FUNCTION get_auth_org_id_safe()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Drop the potential recursive or missing policy
DROP POLICY IF EXISTS "view_org_profiles" ON profiles;

-- Create the new policy using the safe function
CREATE POLICY "view_org_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  organization_id = get_auth_org_id_safe()
);

-- Ensure the "view own" policy is also there (good practice, though redundant for visibility if org matches)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);
