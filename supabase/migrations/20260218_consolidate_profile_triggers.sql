-- Consolidate redundant triggers on profiles table and secure the function
-- Replaces 'on_profile_update' and 'on_profile_change_sync_claims' with a single 'on_profile_mutation'

-- 1. Drop existing triggers
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_change_sync_claims ON public.profiles;

-- 2. Create the consolidated and secured function
CREATE OR REPLACE FUNCTION public.handle_profile_mutation_secured()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role_name text;
BEGIN
  -- Get role name if role_id is present
  IF NEW.role_id IS NOT NULL THEN
    SELECT name INTO _role_name FROM public.roles WHERE id = NEW.role_id;
  END IF;

  -- Update auth.users raw_app_meta_data
  -- We use coalesce to ensure we don't overwrite existing unrelated keys if possible, 
  -- but standard practice for claims sync is usually to be authoritative.
  -- Here we merge with existing data.
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_strip_nulls(jsonb_build_object(
      'organization_id', NEW.organization_id, 
      'role', _role_name,
      'branch_id', NEW.branch_id,
      'class_id', NEW.class_id,
      'full_name', NEW.full_name
    ))
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 3. Create the new single trigger
CREATE TRIGGER on_profile_mutation
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_mutation_secured();

-- 4. Cleanup old functions (optional but good for hygiene)
DROP FUNCTION IF EXISTS public.handle_profile_update();
DROP FUNCTION IF EXISTS public.handle_profile_claims_sync();
