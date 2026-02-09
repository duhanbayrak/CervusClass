-- Drop the recursive policy "Users can view profiles in their org".
-- We should rely on "view_org_profiles" which uses the SECURITY DEFINER function get_auth_org_id().

DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;
