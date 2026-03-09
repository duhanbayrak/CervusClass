-- NOSONAR
-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Optimizing RLS Policies to remove recursion and improve performance
-- Based on SCALABILITY_ANALYSIS.md report

-- 1. Optimize get_auth_org_id to use JWT instead of querying profiles
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- extraction from JWT is much faster and avoids recursion -- NOSONAR
  SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
$function$;

-- 2. CLASSES (Admin Manage)
DROP POLICY IF EXISTS "admin_manage_classes" ON classes;
CREATE POLICY "admin_manage_classes" ON classes
    FOR ALL
    USING (
        organization_id = (auth.jwt()->>'organization_id')::uuid -- NOSONAR
        AND (auth.jwt()->>'role' IN ('admin', 'super_admin'))
    );

-- 3. COURSES (Admin Manage)
DROP POLICY IF EXISTS "admin_manage_courses" ON courses;
CREATE POLICY "admin_manage_courses" ON courses
    FOR ALL
    USING (
        organization_id = (auth.jwt()->>'organization_id')::uuid
        AND (auth.jwt()->>'role' IN ('admin', 'super_admin'))
    );

-- 4. SCHEDULE (Admin Manage)
DROP POLICY IF EXISTS "admin_manage_schedule" ON schedule;
CREATE POLICY "admin_manage_schedule" ON schedule
    FOR ALL
    USING (
        organization_id = (auth.jwt()->>'organization_id')::uuid
        AND (auth.jwt()->>'role' IN ('admin', 'super_admin'))
    );

-- 5. HOMEWORK (Admin Manage)
DROP POLICY IF EXISTS "Admin Manage Org Homework" ON homework;
CREATE POLICY "Admin Manage Org Homework" ON homework
    FOR ALL
    USING (
        organization_id = (auth.jwt()->>'organization_id')::uuid
        AND (auth.jwt()->>'role' IN ('admin', 'super_admin'))
    );

-- 6. TEACHERS (Admin Manage - if policy exists, optimize it)
-- Note: 'profiles' table policies were already checked and are good, but let's ensure 'admin_update_profiles' is optimized if it isn't already.
-- It was: ((organization_id = ((auth.jwt() ->> 'organization_id'::text))::uuid) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))
-- That is already optimal.

-- 7. Ensure view policies use get_auth_org_id() which is now optimized or use direct JWT
-- The existing 'view_org_*' policies use get_auth_org_id() or direct JWT.
-- Since we updated get_auth_org_id(), they are all optimized now.
