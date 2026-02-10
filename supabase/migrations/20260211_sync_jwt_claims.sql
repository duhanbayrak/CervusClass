-- 20260211_sync_jwt_claims.sql

-- Function to sync profile data to auth.users metadata
CREATE OR REPLACE FUNCTION public.handle_profile_claims_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users raw_app_meta_data
  UPDATE auth.users
  SET raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'organization_id', NEW.organization_id,
      'role', (SELECT name FROM public.roles WHERE id = NEW.role_id)
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles update/insert
DROP TRIGGER IF EXISTS on_profile_change_sync_claims ON public.profiles;
CREATE TRIGGER on_profile_change_sync_claims
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_claims_sync();

-- Explicit function to sync all existing users (Migrate existing data)
CREATE OR REPLACE FUNCTION public.sync_all_users_claims()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM public.profiles LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      coalesce(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'organization_id', rec.organization_id,
        'role', (SELECT name FROM public.roles WHERE id = rec.role_id)
      )
    WHERE id = rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
