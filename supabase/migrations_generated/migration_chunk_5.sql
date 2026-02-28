-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Migration Chunk 5 generated at 2026-02-12T07:19:32.965Z

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
    -- Migrating Sude Güler
    ----------------------------------------------------------------
    v_email := 'sude.guler@cervus.test';
    v_full_name := 'Sude Güler';
    v_old_id := '00000000-0000-0000-0000-000002026041';
    
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
    -- Migrating Yiğit Yıldız
    ----------------------------------------------------------------
    v_email := 'yigit.yildiz@cervus.test';
    v_full_name := 'Yiğit Yıldız';
    v_old_id := '00000000-0000-0000-0000-000002026042';
    
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
    -- Migrating Ece Özdemir
    ----------------------------------------------------------------
    v_email := 'ece.ozdemir@cervus.test';
    v_full_name := 'Ece Özdemir';
    v_old_id := '00000000-0000-0000-0000-000002026043';
    
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
    -- Migrating Özge Çelik
    ----------------------------------------------------------------
    v_email := 'ozge.celik@cervus.test';
    v_full_name := 'Özge Çelik';
    v_old_id := '00000000-0000-0000-0000-000002026044';
    
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
    -- Migrating Sarp Çakır
    ----------------------------------------------------------------
    v_email := 'sarp.cakir@cervus.test';
    v_full_name := 'Sarp Çakır';
    v_old_id := '00000000-0000-0000-0000-000002026045';
    
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
    -- Migrating Nil Çelik
    ----------------------------------------------------------------
    v_email := 'nil.celik@cervus.test';
    v_full_name := 'Nil Çelik';
    v_old_id := '00000000-0000-0000-0000-000002026046';
    
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
    -- Migrating Fatma Çetin
    ----------------------------------------------------------------
    v_email := 'fatma.cetin@cervus.test';
    v_full_name := 'Fatma Çetin';
    v_old_id := '00000000-0000-0000-0000-000002026047';
    
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
    -- Migrating Barış Uçar
    ----------------------------------------------------------------
    v_email := 'baris.ucar@cervus.test';
    v_full_name := 'Barış Uçar';
    v_old_id := '00000000-0000-0000-0000-000002026048';
    
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
    -- Migrating Cem Aydın
    ----------------------------------------------------------------
    v_email := 'cem.aydin@cervus.test';
    v_full_name := 'Cem Aydın';
    v_old_id := '00000000-0000-0000-0000-000002026049';
    
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
    -- Migrating Deniz Şahin
    ----------------------------------------------------------------
    v_email := 'deniz.sahin@cervus.test';
    v_full_name := 'Deniz Şahin';
    v_old_id := '00000000-0000-0000-0000-000002026050';
    
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
