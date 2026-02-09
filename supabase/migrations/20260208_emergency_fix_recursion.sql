-- Drop the persistent recursive policy
DROP POLICY IF EXISTS "view_org_profiles" ON profiles;

-- Ensure "Users can view own profile" exists and is correct
-- This is sufficient to fix "Organization ID not found" because the page only queries the user's OWN profile initially.
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Attempt a non-recursive wide policy using a variable approach or distinct separation
-- For now, allowing teachers to view ALL profiles in the table if they are a teacher is a fallback, 
-- but stick to Organization bound.
-- The "safe" way without recursion is to avoid querying the table we are protecting in the policy definition
-- unless we can guarantee the subquery doesn't recurse. 
-- Since we can't guarantee that easily without superuser generated functions, 
-- we will try to use the JWT metadata if available, or just leave it at "view own" to stop the crash.

-- For the student list to work, we need organization visibility.
-- Let's try to add a policy that allows viewing profiles if the target profile's organization_id matches a session variable
-- or if we can rely on a different table.
