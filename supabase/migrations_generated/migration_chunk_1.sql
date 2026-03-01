-- NOSONAR
-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Migration Chunk 1 generated at 2026-02-12T07:19:32.962Z

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
    -- Migrating Ada Özkan
    ----------------------------------------------------------------
    v_email := 'ada.ozkan@cervus.test';
    v_full_name := 'Ada Özkan';
    v_old_id := '00000000-0000-0000-0000-000002026001';
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES ( -- NOSONAR
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
            v_email, crypt(v_password, gen_salt('bf')), now(), -- NOSONAR
            '{"provider": "email", "providers": ["email"]}', -- NOSONAR
            jsonb_build_object('full_name', v_full_name),
            now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_user_id, new_user_id, -- NOSONAR
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
    -- Migrating İrem Aslan
    ----------------------------------------------------------------
    v_email := 'irem.aslan@cervus.test';
    v_full_name := 'İrem Aslan';
    v_old_id := '00000000-0000-0000-0000-000002026002';
    
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
    -- Migrating Tolga Öztürk
    ----------------------------------------------------------------
    v_email := 'tolga.ozturk@cervus.test';
    v_full_name := 'Tolga Öztürk';
    v_old_id := '00000000-0000-0000-0000-000002026003';
    
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
    -- Migrating Gamze Şahin
    ----------------------------------------------------------------
    v_email := 'gamze.sahin@cervus.test';
    v_full_name := 'Gamze Şahin';
    v_old_id := '00000000-0000-0000-0000-000002026004';
    
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
    -- Migrating Asya Uçar
    ----------------------------------------------------------------
    v_email := 'asya.ucar@cervus.test';
    v_full_name := 'Asya Uçar';
    v_old_id := '00000000-0000-0000-0000-000002026005';
    
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
    -- Migrating Kaan Uçar
    ----------------------------------------------------------------
    v_email := 'kaan.ucar@cervus.test';
    v_full_name := 'Kaan Uçar';
    v_old_id := '00000000-0000-0000-0000-000002026006';
    
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
    -- Migrating Elif Çetin
    ----------------------------------------------------------------
    v_email := 'elif.cetin@cervus.test';
    v_full_name := 'Elif Çetin';
    v_old_id := '00000000-0000-0000-0000-000002026007';
    
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
    -- Migrating Berk Özdemir
    ----------------------------------------------------------------
    v_email := 'berk.ozdemir@cervus.test';
    v_full_name := 'Berk Özdemir';
    v_old_id := '00000000-0000-0000-0000-000002026008';
    
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
    -- Migrating Ahmet Özkan
    ----------------------------------------------------------------
    v_email := 'ahmet.ozkan@cervus.test';
    v_full_name := 'Ahmet Özkan';
    v_old_id := '00000000-0000-0000-0000-000002026009';
    
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
    -- Migrating Onur Çakır
    ----------------------------------------------------------------
    v_email := 'onur.cakir@cervus.test';
    v_full_name := 'Onur Çakır';
    v_old_id := '00000000-0000-0000-0000-000002026010';
    
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
