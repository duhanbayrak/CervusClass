-- NOSONAR\n-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Migration Script for Students generated at 2026-02-12T07:13:43.803Z

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
    -- Migrating Ada Özkan (00000000-0000-0000-0000-000002026001)
    ----------------------------------------------------------------
    v_email := 'ada.ozkan@cervus.test';
    v_full_name := 'Ada Özkan';
    v_old_id := '00000000-0000-0000-0000-000002026001';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating İrem Aslan (00000000-0000-0000-0000-000002026002)
    ----------------------------------------------------------------
    v_email := 'irem.aslan@cervus.test';
    v_full_name := 'İrem Aslan';
    v_old_id := '00000000-0000-0000-0000-000002026002';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Tolga Öztürk (00000000-0000-0000-0000-000002026003)
    ----------------------------------------------------------------
    v_email := 'tolga.ozturk@cervus.test';
    v_full_name := 'Tolga Öztürk';
    v_old_id := '00000000-0000-0000-0000-000002026003';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Gamze Şahin (00000000-0000-0000-0000-000002026004)
    ----------------------------------------------------------------
    v_email := 'gamze.sahin@cervus.test';
    v_full_name := 'Gamze Şahin';
    v_old_id := '00000000-0000-0000-0000-000002026004';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Asya Uçar (00000000-0000-0000-0000-000002026005)
    ----------------------------------------------------------------
    v_email := 'asya.ucar@cervus.test';
    v_full_name := 'Asya Uçar';
    v_old_id := '00000000-0000-0000-0000-000002026005';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Kaan Uçar (00000000-0000-0000-0000-000002026006)
    ----------------------------------------------------------------
    v_email := 'kaan.ucar@cervus.test';
    v_full_name := 'Kaan Uçar';
    v_old_id := '00000000-0000-0000-0000-000002026006';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Elif Çetin (00000000-0000-0000-0000-000002026007)
    ----------------------------------------------------------------
    v_email := 'elif.cetin@cervus.test';
    v_full_name := 'Elif Çetin';
    v_old_id := '00000000-0000-0000-0000-000002026007';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Berk Özdemir (00000000-0000-0000-0000-000002026008)
    ----------------------------------------------------------------
    v_email := 'berk.ozdemir@cervus.test';
    v_full_name := 'Berk Özdemir';
    v_old_id := '00000000-0000-0000-0000-000002026008';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ahmet Özkan (00000000-0000-0000-0000-000002026009)
    ----------------------------------------------------------------
    v_email := 'ahmet.ozkan@cervus.test';
    v_full_name := 'Ahmet Özkan';
    v_old_id := '00000000-0000-0000-0000-000002026009';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Onur Çakır (00000000-0000-0000-0000-000002026010)
    ----------------------------------------------------------------
    v_email := 'onur.cakir@cervus.test';
    v_full_name := 'Onur Çakır';
    v_old_id := '00000000-0000-0000-0000-000002026010';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Eren Yavuz (00000000-0000-0000-0000-000002026011)
    ----------------------------------------------------------------
    v_email := 'eren.yavuz@cervus.test';
    v_full_name := 'Eren Yavuz';
    v_old_id := '00000000-0000-0000-0000-000002026011';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Mustafa Kılıç (00000000-0000-0000-0000-000002026012)
    ----------------------------------------------------------------
    v_email := 'mustafa.kilic@cervus.test';
    v_full_name := 'Mustafa Kılıç';
    v_old_id := '00000000-0000-0000-0000-000002026012';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Cem Öztürk (00000000-0000-0000-0000-000002026013)
    ----------------------------------------------------------------
    v_email := 'cem.ozturk@cervus.test';
    v_full_name := 'Cem Öztürk';
    v_old_id := '00000000-0000-0000-0000-000002026013';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Can Yavuz (00000000-0000-0000-0000-000002026014)
    ----------------------------------------------------------------
    v_email := 'can.yavuz@cervus.test';
    v_full_name := 'Can Yavuz';
    v_old_id := '00000000-0000-0000-0000-000002026014';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Emre Yıldırım (00000000-0000-0000-0000-000002026015)
    ----------------------------------------------------------------
    v_email := 'emre.yildirim@cervus.test';
    v_full_name := 'Emre Yıldırım';
    v_old_id := '00000000-0000-0000-0000-000002026015';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Özge Özdemir (00000000-0000-0000-0000-000002026016)
    ----------------------------------------------------------------
    v_email := 'ozge.ozdemir@cervus.test';
    v_full_name := 'Özge Özdemir';
    v_old_id := '00000000-0000-0000-0000-000002026016';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Barış Aydın (00000000-0000-0000-0000-000002026017)
    ----------------------------------------------------------------
    v_email := 'baris.aydin@cervus.test';
    v_full_name := 'Barış Aydın';
    v_old_id := '00000000-0000-0000-0000-000002026017';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Nil Arslan (00000000-0000-0000-0000-000002026018)
    ----------------------------------------------------------------
    v_email := 'nil.arslan@cervus.test';
    v_full_name := 'Nil Arslan';
    v_old_id := '00000000-0000-0000-0000-000002026018';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Derin Çelik (00000000-0000-0000-0000-000002026019)
    ----------------------------------------------------------------
    v_email := 'derin.celik@cervus.test';
    v_full_name := 'Derin Çelik';
    v_old_id := '00000000-0000-0000-0000-000002026019';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Zeynep Çakır (00000000-0000-0000-0000-000002026020)
    ----------------------------------------------------------------
    v_email := 'zeynep.cakir@cervus.test';
    v_full_name := 'Zeynep Çakır';
    v_old_id := '00000000-0000-0000-0000-000002026020';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ece Kılıç (00000000-0000-0000-0000-000002026021)
    ----------------------------------------------------------------
    v_email := 'ece.kilic@cervus.test';
    v_full_name := 'Ece Kılıç';
    v_old_id := '00000000-0000-0000-0000-000002026021';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Kerem Özkan (00000000-0000-0000-0000-000002026022)
    ----------------------------------------------------------------
    v_email := 'kerem.ozkan@cervus.test';
    v_full_name := 'Kerem Özkan';
    v_old_id := '00000000-0000-0000-0000-000002026022';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Asya Çelik (00000000-0000-0000-0000-000002026023)
    ----------------------------------------------------------------
    v_email := 'asya.celik@cervus.test';
    v_full_name := 'Asya Çelik';
    v_old_id := '00000000-0000-0000-0000-000002026023';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Melis Yıldız (00000000-0000-0000-0000-000002026024)
    ----------------------------------------------------------------
    v_email := 'melis.yildiz@cervus.test';
    v_full_name := 'Melis Yıldız';
    v_old_id := '00000000-0000-0000-0000-000002026024';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating İrem Gül (00000000-0000-0000-0000-000002026025)
    ----------------------------------------------------------------
    v_email := 'irem.gul@cervus.test';
    v_full_name := 'İrem Gül';
    v_old_id := '00000000-0000-0000-0000-000002026025';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Mustafa Acar (00000000-0000-0000-0000-000002026026)
    ----------------------------------------------------------------
    v_email := 'mustafa.acar@cervus.test';
    v_full_name := 'Mustafa Acar';
    v_old_id := '00000000-0000-0000-0000-000002026026';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ege Kara (00000000-0000-0000-0000-000002026027)
    ----------------------------------------------------------------
    v_email := 'ege.kara@cervus.test';
    v_full_name := 'Ege Kara';
    v_old_id := '00000000-0000-0000-0000-000002026027';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Yiğit Korkmaz (00000000-0000-0000-0000-000002026028)
    ----------------------------------------------------------------
    v_email := 'yigit.korkmaz@cervus.test';
    v_full_name := 'Yiğit Korkmaz';
    v_old_id := '00000000-0000-0000-0000-000002026028';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Burak Koç (00000000-0000-0000-0000-000002026029)
    ----------------------------------------------------------------
    v_email := 'burak.koc@cervus.test';
    v_full_name := 'Burak Koç';
    v_old_id := '00000000-0000-0000-0000-000002026029';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ece Erdoğan (00000000-0000-0000-0000-000002026030)
    ----------------------------------------------------------------
    v_email := 'ece.erdogan@cervus.test';
    v_full_name := 'Ece Erdoğan';
    v_old_id := '00000000-0000-0000-0000-000002026030';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ayşe Aydın (00000000-0000-0000-0000-000002026031)
    ----------------------------------------------------------------
    v_email := 'ayse.aydin@cervus.test';
    v_full_name := 'Ayşe Aydın';
    v_old_id := '00000000-0000-0000-0000-000002026031';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ela Yıldız (00000000-0000-0000-0000-000002026032)
    ----------------------------------------------------------------
    v_email := 'ela.yildiz@cervus.test';
    v_full_name := 'Ela Yıldız';
    v_old_id := '00000000-0000-0000-0000-000002026032';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Buse Şimşek (00000000-0000-0000-0000-000002026033)
    ----------------------------------------------------------------
    v_email := 'buse.simsek@cervus.test';
    v_full_name := 'Buse Şimşek';
    v_old_id := '00000000-0000-0000-0000-000002026033';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Naz Kara (00000000-0000-0000-0000-000002026034)
    ----------------------------------------------------------------
    v_email := 'naz.kara@cervus.test';
    v_full_name := 'Naz Kara';
    v_old_id := '00000000-0000-0000-0000-000002026034';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Selin Acar (00000000-0000-0000-0000-000002026035)
    ----------------------------------------------------------------
    v_email := 'selin.acar@cervus.test';
    v_full_name := 'Selin Acar';
    v_old_id := '00000000-0000-0000-0000-000002026035';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Esra Gül (00000000-0000-0000-0000-000002026036)
    ----------------------------------------------------------------
    v_email := 'esra.gul@cervus.test';
    v_full_name := 'Esra Gül';
    v_old_id := '00000000-0000-0000-0000-000002026036';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Alp Yavuz (00000000-0000-0000-0000-000002026037)
    ----------------------------------------------------------------
    v_email := 'alp.yavuz@cervus.test';
    v_full_name := 'Alp Yavuz';
    v_old_id := '00000000-0000-0000-0000-000002026037';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Tolga Yılmaz (00000000-0000-0000-0000-000002026038)
    ----------------------------------------------------------------
    v_email := 'tolga.yilmaz@cervus.test';
    v_full_name := 'Tolga Yılmaz';
    v_old_id := '00000000-0000-0000-0000-000002026038';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Barış Kaya (00000000-0000-0000-0000-000002026039)
    ----------------------------------------------------------------
    v_email := 'baris.kaya@cervus.test';
    v_full_name := 'Barış Kaya';
    v_old_id := '00000000-0000-0000-0000-000002026039';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ahmet Özkan (00000000-0000-0000-0000-000002026040)
    ----------------------------------------------------------------
    v_email := 'ahmet.ozkan.2@cervus.test';
    v_full_name := 'Ahmet Özkan';
    v_old_id := '00000000-0000-0000-0000-000002026040';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Sude Güler (00000000-0000-0000-0000-000002026041)
    ----------------------------------------------------------------
    v_email := 'sude.guler@cervus.test';
    v_full_name := 'Sude Güler';
    v_old_id := '00000000-0000-0000-0000-000002026041';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Yiğit Yıldız (00000000-0000-0000-0000-000002026042)
    ----------------------------------------------------------------
    v_email := 'yigit.yildiz@cervus.test';
    v_full_name := 'Yiğit Yıldız';
    v_old_id := '00000000-0000-0000-0000-000002026042';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ece Özdemir (00000000-0000-0000-0000-000002026043)
    ----------------------------------------------------------------
    v_email := 'ece.ozdemir@cervus.test';
    v_full_name := 'Ece Özdemir';
    v_old_id := '00000000-0000-0000-0000-000002026043';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Özge Çelik (00000000-0000-0000-0000-000002026044)
    ----------------------------------------------------------------
    v_email := 'ozge.celik@cervus.test';
    v_full_name := 'Özge Çelik';
    v_old_id := '00000000-0000-0000-0000-000002026044';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Sarp Çakır (00000000-0000-0000-0000-000002026045)
    ----------------------------------------------------------------
    v_email := 'sarp.cakir@cervus.test';
    v_full_name := 'Sarp Çakır';
    v_old_id := '00000000-0000-0000-0000-000002026045';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Nil Çelik (00000000-0000-0000-0000-000002026046)
    ----------------------------------------------------------------
    v_email := 'nil.celik@cervus.test';
    v_full_name := 'Nil Çelik';
    v_old_id := '00000000-0000-0000-0000-000002026046';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Fatma Çetin (00000000-0000-0000-0000-000002026047)
    ----------------------------------------------------------------
    v_email := 'fatma.cetin@cervus.test';
    v_full_name := 'Fatma Çetin';
    v_old_id := '00000000-0000-0000-0000-000002026047';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Barış Uçar (00000000-0000-0000-0000-000002026048)
    ----------------------------------------------------------------
    v_email := 'baris.ucar@cervus.test';
    v_full_name := 'Barış Uçar';
    v_old_id := '00000000-0000-0000-0000-000002026048';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Cem Aydın (00000000-0000-0000-0000-000002026049)
    ----------------------------------------------------------------
    v_email := 'cem.aydin@cervus.test';
    v_full_name := 'Cem Aydın';
    v_old_id := '00000000-0000-0000-0000-000002026049';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Deniz Şahin (00000000-0000-0000-0000-000002026050)
    ----------------------------------------------------------------
    v_email := 'deniz.sahin@cervus.test';
    v_full_name := 'Deniz Şahin';
    v_old_id := '00000000-0000-0000-0000-000002026050';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Naz Güler (00000000-0000-0000-0000-000002026051)
    ----------------------------------------------------------------
    v_email := 'naz.guler@cervus.test';
    v_full_name := 'Naz Güler';
    v_old_id := '00000000-0000-0000-0000-000002026051';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Can Demir (00000000-0000-0000-0000-000002026052)
    ----------------------------------------------------------------
    v_email := 'can.demir@cervus.test';
    v_full_name := 'Can Demir';
    v_old_id := '00000000-0000-0000-0000-000002026052';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Esra Öztürk (00000000-0000-0000-0000-000002026053)
    ----------------------------------------------------------------
    v_email := 'esra.ozturk@cervus.test';
    v_full_name := 'Esra Öztürk';
    v_old_id := '00000000-0000-0000-0000-000002026053';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Can Çetin (00000000-0000-0000-0000-000002026054)
    ----------------------------------------------------------------
    v_email := 'can.cetin@cervus.test';
    v_full_name := 'Can Çetin';
    v_old_id := '00000000-0000-0000-0000-000002026054';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Rüzgar Özdemir (00000000-0000-0000-0000-000002026055)
    ----------------------------------------------------------------
    v_email := 'ruzgar.ozdemir@cervus.test';
    v_full_name := 'Rüzgar Özdemir';
    v_old_id := '00000000-0000-0000-0000-000002026055';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Cem Korkmaz (00000000-0000-0000-0000-000002026056)
    ----------------------------------------------------------------
    v_email := 'cem.korkmaz@cervus.test';
    v_full_name := 'Cem Korkmaz';
    v_old_id := '00000000-0000-0000-0000-000002026056';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Duru Gül (00000000-0000-0000-0000-000002026057)
    ----------------------------------------------------------------
    v_email := 'duru.gul@cervus.test';
    v_full_name := 'Duru Gül';
    v_old_id := '00000000-0000-0000-0000-000002026057';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Alp Aydın (00000000-0000-0000-0000-000002026058)
    ----------------------------------------------------------------
    v_email := 'alp.aydin@cervus.test';
    v_full_name := 'Alp Aydın';
    v_old_id := '00000000-0000-0000-0000-000002026058';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Tolga Aslan (00000000-0000-0000-0000-000002026059)
    ----------------------------------------------------------------
    v_email := 'tolga.aslan@cervus.test';
    v_full_name := 'Tolga Aslan';
    v_old_id := '00000000-0000-0000-0000-000002026059';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Kerem Çakır (00000000-0000-0000-0000-000002026060)
    ----------------------------------------------------------------
    v_email := 'kerem.cakir@cervus.test';
    v_full_name := 'Kerem Çakır';
    v_old_id := '00000000-0000-0000-0000-000002026060';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Elif Çakır (00000000-0000-0000-0000-000002026061)
    ----------------------------------------------------------------
    v_email := 'elif.cakir@cervus.test';
    v_full_name := 'Elif Çakır';
    v_old_id := '00000000-0000-0000-0000-000002026061';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Sude Polat (00000000-0000-0000-0000-000002026062)
    ----------------------------------------------------------------
    v_email := 'sude.polat@cervus.test';
    v_full_name := 'Sude Polat';
    v_old_id := '00000000-0000-0000-0000-000002026062';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Tuna Aydın (00000000-0000-0000-0000-000002026063)
    ----------------------------------------------------------------
    v_email := 'tuna.aydin@cervus.test';
    v_full_name := 'Tuna Aydın';
    v_old_id := '00000000-0000-0000-0000-000002026063';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Zeynep Şahin (00000000-0000-0000-0000-000002026064)
    ----------------------------------------------------------------
    v_email := 'zeynep.sahin@cervus.test';
    v_full_name := 'Zeynep Şahin';
    v_old_id := '00000000-0000-0000-0000-000002026064';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Gizem Erdoğan (00000000-0000-0000-0000-000002026065)
    ----------------------------------------------------------------
    v_email := 'gizem.erdogan@cervus.test';
    v_full_name := 'Gizem Erdoğan';
    v_old_id := '00000000-0000-0000-0000-000002026065';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Emre Şimşek (00000000-0000-0000-0000-000002026066)
    ----------------------------------------------------------------
    v_email := 'emre.simsek@cervus.test';
    v_full_name := 'Emre Şimşek';
    v_old_id := '00000000-0000-0000-0000-000002026066';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Çınar Çelik (00000000-0000-0000-0000-000002026067)
    ----------------------------------------------------------------
    v_email := 'cinar.celik@cervus.test';
    v_full_name := 'Çınar Çelik';
    v_old_id := '00000000-0000-0000-0000-000002026067';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Kerem Acar (00000000-0000-0000-0000-000002026068)
    ----------------------------------------------------------------
    v_email := 'kerem.acar@cervus.test';
    v_full_name := 'Kerem Acar';
    v_old_id := '00000000-0000-0000-0000-000002026068';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Kerem Şahin (00000000-0000-0000-0000-000002026069)
    ----------------------------------------------------------------
    v_email := 'kerem.sahin@cervus.test';
    v_full_name := 'Kerem Şahin';
    v_old_id := '00000000-0000-0000-0000-000002026069';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Berk Gül (00000000-0000-0000-0000-000002026070)
    ----------------------------------------------------------------
    v_email := 'berk.gul@cervus.test';
    v_full_name := 'Berk Gül';
    v_old_id := '00000000-0000-0000-0000-000002026070';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Yiğit Arslan (00000000-0000-0000-0000-000002026071)
    ----------------------------------------------------------------
    v_email := 'yigit.arslan@cervus.test';
    v_full_name := 'Yiğit Arslan';
    v_old_id := '00000000-0000-0000-0000-000002026071';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Esra Erdoğan (00000000-0000-0000-0000-000002026072)
    ----------------------------------------------------------------
    v_email := 'esra.erdogan@cervus.test';
    v_full_name := 'Esra Erdoğan';
    v_old_id := '00000000-0000-0000-0000-000002026072';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Can Kaya (00000000-0000-0000-0000-000002026073)
    ----------------------------------------------------------------
    v_email := 'can.kaya@cervus.test';
    v_full_name := 'Can Kaya';
    v_old_id := '00000000-0000-0000-0000-000002026073';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Selin Kılıç (00000000-0000-0000-0000-000002026074)
    ----------------------------------------------------------------
    v_email := 'selin.kilic@cervus.test';
    v_full_name := 'Selin Kılıç';
    v_old_id := '00000000-0000-0000-0000-000002026074';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Berk Güler (00000000-0000-0000-0000-000002026075)
    ----------------------------------------------------------------
    v_email := 'berk.guler@cervus.test';
    v_full_name := 'Berk Güler';
    v_old_id := '00000000-0000-0000-0000-000002026075';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Fatma Öztürk (00000000-0000-0000-0000-000002026076)
    ----------------------------------------------------------------
    v_email := 'fatma.ozturk@cervus.test';
    v_full_name := 'Fatma Öztürk';
    v_old_id := '00000000-0000-0000-0000-000002026076';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Çınar Güler (00000000-0000-0000-0000-000002026077)
    ----------------------------------------------------------------
    v_email := 'cinar.guler@cervus.test';
    v_full_name := 'Çınar Güler';
    v_old_id := '00000000-0000-0000-0000-000002026077';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ece Doğan (00000000-0000-0000-0000-000002026078)
    ----------------------------------------------------------------
    v_email := 'ece.dogan@cervus.test';
    v_full_name := 'Ece Doğan';
    v_old_id := '00000000-0000-0000-0000-000002026078';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Mustafa Kara (00000000-0000-0000-0000-000002026079)
    ----------------------------------------------------------------
    v_email := 'mustafa.kara@cervus.test';
    v_full_name := 'Mustafa Kara';
    v_old_id := '00000000-0000-0000-0000-000002026079';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


    ----------------------------------------------------------------
    -- Migrating Ada Özkan (00000000-0000-0000-0000-000002026080)
    ----------------------------------------------------------------
    v_email := 'ada.ozkan.2@cervus.test';
    v_full_name := 'Ada Özkan';
    v_old_id := '00000000-0000-0000-0000-000002026080';
    
    -- 1. Create Identity in auth.users
    -- Check if user exists by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = v_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', v_full_name),
            now(),
            now(),
            '',
            ''
        );
        
        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            jsonb_build_object('sub', new_user_id, 'email', v_email),
            'email',
            now(),
            now(),
            now()
        );
    END IF;

    -- 2. Migrate Profile Data
    -- We need to check if profile with new_user_id already exists (from a previous partial run)
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

    -- 3. Update References
    UPDATE public.study_sessions SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.exam_results SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.attendance SET student_id = new_user_id WHERE student_id = v_old_id;
    UPDATE public.homework_submissions SET student_id = new_user_id WHERE student_id = v_old_id;
    
    -- 4. Delete Old Profile
    -- Only delete if IDs are different to avoid suicide
    IF new_user_id != v_old_id THEN
        DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;


END $$;
