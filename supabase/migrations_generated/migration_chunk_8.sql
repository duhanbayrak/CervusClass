-- NOSONAR
-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Migration Chunk 8 generated at 2026-02-12T07:19:32.966Z

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
    -- Migrating Yiğit Arslan
    ----------------------------------------------------------------
    v_email := 'yigit.arslan@cervus.test';
    v_full_name := 'Yiğit Arslan';
    v_old_id := '00000000-0000-0000-0000-000002026071';
    
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
    -- Migrating Esra Erdoğan
    ----------------------------------------------------------------
    v_email := 'esra.erdogan@cervus.test';
    v_full_name := 'Esra Erdoğan';
    v_old_id := '00000000-0000-0000-0000-000002026072';
    
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
    -- Migrating Can Kaya
    ----------------------------------------------------------------
    v_email := 'can.kaya@cervus.test';
    v_full_name := 'Can Kaya';
    v_old_id := '00000000-0000-0000-0000-000002026073';
    
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
    -- Migrating Selin Kılıç
    ----------------------------------------------------------------
    v_email := 'selin.kilic@cervus.test';
    v_full_name := 'Selin Kılıç';
    v_old_id := '00000000-0000-0000-0000-000002026074';
    
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
    -- Migrating Berk Güler
    ----------------------------------------------------------------
    v_email := 'berk.guler@cervus.test';
    v_full_name := 'Berk Güler';
    v_old_id := '00000000-0000-0000-0000-000002026075';
    
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
    -- Migrating Fatma Öztürk
    ----------------------------------------------------------------
    v_email := 'fatma.ozturk@cervus.test';
    v_full_name := 'Fatma Öztürk';
    v_old_id := '00000000-0000-0000-0000-000002026076';
    
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
    -- Migrating Çınar Güler
    ----------------------------------------------------------------
    v_email := 'cinar.guler@cervus.test';
    v_full_name := 'Çınar Güler';
    v_old_id := '00000000-0000-0000-0000-000002026077';
    
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
    -- Migrating Ece Doğan
    ----------------------------------------------------------------
    v_email := 'ece.dogan@cervus.test';
    v_full_name := 'Ece Doğan';
    v_old_id := '00000000-0000-0000-0000-000002026078';
    
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
    -- Migrating Mustafa Kara
    ----------------------------------------------------------------
    v_email := 'mustafa.kara@cervus.test';
    v_full_name := 'Mustafa Kara';
    v_old_id := '00000000-0000-0000-0000-000002026079';
    
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
    -- Migrating Ada Özkan
    ----------------------------------------------------------------
    v_email := 'ada.ozkan.2@cervus.test';
    v_full_name := 'Ada Özkan';
    v_old_id := '00000000-0000-0000-0000-000002026080';
    
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
