-- Enable RLS on profiles if not already enabled (idempotent usually)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting or restrictive policies if we know their names, 
-- but better to just add a permissible one.
-- "Users can view profiles in their org" is the standard name from schema.sql.
DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;

-- Re-create the policy to ensure it works correctly
CREATE POLICY "Users can view profiles in their org"
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
