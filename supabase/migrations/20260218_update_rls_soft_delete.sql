-- Update RLS policies to enforce Soft Delete (hide deleted records)

-- 1. CLASSES
DROP POLICY IF EXISTS "view_org_classes" ON public.classes;
CREATE POLICY "view_org_classes"
ON public.classes FOR SELECT
USING (
  organization_id = get_auth_org_id() 
  AND deleted_at IS NULL
);

-- 2. EXAM_RESULTS
DROP POLICY IF EXISTS "view_org_exam_results" ON public.exam_results;
CREATE POLICY "view_org_exam_results"
ON public.exam_results FOR SELECT
USING (
  organization_id = get_auth_org_id() 
  AND deleted_at IS NULL
);

-- 3. HOMEWORK
DROP POLICY IF EXISTS "view_org_homework" ON public.homework;
CREATE POLICY "view_org_homework"
ON public.homework FOR SELECT
USING (
  organization_id = get_auth_org_id() 
  AND deleted_at IS NULL
);

-- 4. PROFILES
-- We update the organizational view. 
-- Note: 'get_auth_org_id()' helper might be used in the original policy or a raw JSON check. 
-- We will match the logic we saw in the inspection: 
-- "organization_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'organization_id'::text))::uuid"
-- But we can use the cleaner 'get_auth_org_id()' if available (it seems it is, based on other policies).
DROP POLICY IF EXISTS "view_org_profiles" ON public.profiles;
CREATE POLICY "view_org_profiles"
ON public.profiles FOR SELECT
USING (
  organization_id = (auth.jwt() ->> 'organization_id')::uuid
  AND deleted_at IS NULL
);
-- Also update the policy for users viewing their own profile? 
-- Maybe not, finding yourself shouldn't fail even if marked deleted, to show "Account Deleted" message etc.

-- 5. SCHEDULE
DROP POLICY IF EXISTS "view_org_schedule" ON public.schedule;
CREATE POLICY "view_org_schedule"
ON public.schedule FOR SELECT
USING (
  organization_id = get_auth_org_id() 
  AND deleted_at IS NULL
);
