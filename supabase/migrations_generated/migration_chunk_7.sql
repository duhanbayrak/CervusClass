-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Migration Chunk 7 generated at 2026-02-12T07:19:32.966Z

-- Function to create user if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_user_id UUID;
    v_email TEXT;
    v_password TEXT := '123456';
    v_full_name TEXT;
    v_old_id UUID;
BEGIN

    ----------------------------------------------------------------
    -- Migrating Elif Çakır
    ----------------------------------------------------------------
    v_email := 'elif.cakir@cervus.test';
    v_full_name := 'Elif Çakır';
    v_old_id := '00000000-0000-0000-0000-000002026061';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Sude Polat
    ----------------------------------------------------------------
    v_email := 'sude.polat@cervus.test';
    v_full_name := 'Sude Polat';
    v_old_id := '00000000-0000-0000-0000-000002026062';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Tuna Aydın
    ----------------------------------------------------------------
    v_email := 'tuna.aydin@cervus.test';
    v_full_name := 'Tuna Aydın';
    v_old_id := '00000000-0000-0000-0000-000002026063';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Zeynep Şahin
    ----------------------------------------------------------------
    v_email := 'zeynep.sahin@cervus.test';
    v_full_name := 'Zeynep Şahin';
    v_old_id := '00000000-0000-0000-0000-000002026064';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Gizem Erdoğan
    ----------------------------------------------------------------
    v_email := 'gizem.erdogan@cervus.test';
    v_full_name := 'Gizem Erdoğan';
    v_old_id := '00000000-0000-0000-0000-000002026065';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Emre Şimşek
    ----------------------------------------------------------------
    v_email := 'emre.simsek@cervus.test';
    v_full_name := 'Emre Şimşek';
    v_old_id := '00000000-0000-0000-0000-000002026066';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Çınar Çelik
    ----------------------------------------------------------------
    v_email := 'cinar.celik@cervus.test';
    v_full_name := 'Çınar Çelik';
    v_old_id := '00000000-0000-0000-0000-000002026067';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Kerem Acar
    ----------------------------------------------------------------
    v_email := 'kerem.acar@cervus.test';
    v_full_name := 'Kerem Acar';
    v_old_id := '00000000-0000-0000-0000-000002026068';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Kerem Şahin
    ----------------------------------------------------------------
    v_email := 'kerem.sahin@cervus.test';
    v_full_name := 'Kerem Şahin';
    v_old_id := '00000000-0000-0000-0000-000002026069';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    ----------------------------------------------------------------
    -- Migrating Berk Gül
    ----------------------------------------------------------------
    v_email := 'berk.gul@cervus.test';
    v_full_name := 'Berk Gül';
    v_old_id := '00000000-0000-0000-0000-000002026070';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email, 'email_verified', false, 'phone_verified', false),
            'email', now(), now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
       INSERT INTO public.profiles (
            id, full_name, title, email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       )
       SELECT 
            new_user_id, full_name, title, v_email, phone, avatar_url, bio, role_id, class_id, 
            organization_id, start_date, branch_id, birth_date, student_number
       FROM public.profiles 
       WHERE id = v_old_id;
    END IF;

    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

END $$;
