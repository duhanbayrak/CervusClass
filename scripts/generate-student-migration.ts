import fs from 'fs';

function generateEmail(fullName: string): string {
    const normalized = fullName.toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '.');

    return `${normalized}@cervus.test`;
}

// Data fetched from Supabase via MCP tool
const profiles = [
    { "id": "00000000-0000-0000-0000-000002026001", "full_name": "Ada Özkan" },
    { "id": "00000000-0000-0000-0000-000002026002", "full_name": "İrem Aslan" },
    { "id": "00000000-0000-0000-0000-000002026003", "full_name": "Tolga Öztürk" },
    { "id": "00000000-0000-0000-0000-000002026004", "full_name": "Gamze Şahin" },
    { "id": "00000000-0000-0000-0000-000002026005", "full_name": "Asya Uçar" },
    { "id": "00000000-0000-0000-0000-000002026006", "full_name": "Kaan Uçar" },
    { "id": "00000000-0000-0000-0000-000002026007", "full_name": "Elif Çetin" },
    { "id": "00000000-0000-0000-0000-000002026008", "full_name": "Berk Özdemir" },
    { "id": "00000000-0000-0000-0000-000002026009", "full_name": "Ahmet Özkan" },
    { "id": "00000000-0000-0000-0000-000002026010", "full_name": "Onur Çakır" },
    { "id": "00000000-0000-0000-0000-000002026011", "full_name": "Eren Yavuz" },
    { "id": "00000000-0000-0000-0000-000002026012", "full_name": "Mustafa Kılıç" },
    { "id": "00000000-0000-0000-0000-000002026013", "full_name": "Cem Öztürk" },
    { "id": "00000000-0000-0000-0000-000002026014", "full_name": "Can Yavuz" },
    { "id": "00000000-0000-0000-0000-000002026015", "full_name": "Emre Yıldırım" },
    { "id": "00000000-0000-0000-0000-000002026016", "full_name": "Özge Özdemir" },
    { "id": "00000000-0000-0000-0000-000002026017", "full_name": "Barış Aydın" },
    { "id": "00000000-0000-0000-0000-000002026018", "full_name": "Nil Arslan" },
    { "id": "00000000-0000-0000-0000-000002026019", "full_name": "Derin Çelik" },
    { "id": "00000000-0000-0000-0000-000002026020", "full_name": "Zeynep Çakır" },
    { "id": "00000000-0000-0000-0000-000002026021", "full_name": "Ece Kılıç" },
    { "id": "00000000-0000-0000-0000-000002026022", "full_name": "Kerem Özkan" },
    { "id": "00000000-0000-0000-0000-000002026023", "full_name": "Asya Çelik" },
    { "id": "00000000-0000-0000-0000-000002026024", "full_name": "Melis Yıldız" },
    { "id": "00000000-0000-0000-0000-000002026025", "full_name": "İrem Gül" },
    { "id": "00000000-0000-0000-0000-000002026026", "full_name": "Mustafa Acar" },
    { "id": "00000000-0000-0000-0000-000002026027", "full_name": "Ege Kara" },
    { "id": "00000000-0000-0000-0000-000002026028", "full_name": "Yiğit Korkmaz" },
    { "id": "00000000-0000-0000-0000-000002026029", "full_name": "Burak Koç" },
    { "id": "00000000-0000-0000-0000-000002026030", "full_name": "Ece Erdoğan" },
    { "id": "00000000-0000-0000-0000-000002026031", "full_name": "Ayşe Aydın" },
    { "id": "00000000-0000-0000-0000-000002026032", "full_name": "Ela Yıldız" },
    { "id": "00000000-0000-0000-0000-000002026033", "full_name": "Buse Şimşek" },
    { "id": "00000000-0000-0000-0000-000002026034", "full_name": "Naz Kara" },
    { "id": "00000000-0000-0000-0000-000002026035", "full_name": "Selin Acar" },
    { "id": "00000000-0000-0000-0000-000002026036", "full_name": "Esra Gül" },
    { "id": "00000000-0000-0000-0000-000002026037", "full_name": "Alp Yavuz" },
    { "id": "00000000-0000-0000-0000-000002026038", "full_name": "Tolga Yılmaz" },
    { "id": "00000000-0000-0000-0000-000002026039", "full_name": "Barış Kaya" },
    { "id": "00000000-0000-0000-0000-000002026040", "full_name": "Ahmet Özkan" },
    { "id": "00000000-0000-0000-0000-000002026041", "full_name": "Sude Güler" },
    { "id": "00000000-0000-0000-0000-000002026042", "full_name": "Yiğit Yıldız" },
    { "id": "00000000-0000-0000-0000-000002026043", "full_name": "Ece Özdemir" },
    { "id": "00000000-0000-0000-0000-000002026044", "full_name": "Özge Çelik" },
    { "id": "00000000-0000-0000-0000-000002026045", "full_name": "Sarp Çakır" },
    { "id": "00000000-0000-0000-0000-000002026046", "full_name": "Nil Çelik" },
    { "id": "00000000-0000-0000-0000-000002026047", "full_name": "Fatma Çetin" },
    { "id": "00000000-0000-0000-0000-000002026048", "full_name": "Barış Uçar" },
    { "id": "00000000-0000-0000-0000-000002026049", "full_name": "Cem Aydın" },
    { "id": "00000000-0000-0000-0000-000002026050", "full_name": "Deniz Şahin" },
    { "id": "00000000-0000-0000-0000-000002026051", "full_name": "Naz Güler" },
    { "id": "00000000-0000-0000-0000-000002026052", "full_name": "Can Demir" },
    { "id": "00000000-0000-0000-0000-000002026053", "full_name": "Esra Öztürk" },
    { "id": "00000000-0000-0000-0000-000002026054", "full_name": "Can Çetin" },
    { "id": "00000000-0000-0000-0000-000002026055", "full_name": "Rüzgar Özdemir" },
    { "id": "00000000-0000-0000-0000-000002026056", "full_name": "Cem Korkmaz" },
    { "id": "00000000-0000-0000-0000-000002026057", "full_name": "Duru Gül" },
    { "id": "00000000-0000-0000-0000-000002026058", "full_name": "Alp Aydın" },
    { "id": "00000000-0000-0000-0000-000002026059", "full_name": "Tolga Aslan" },
    { "id": "00000000-0000-0000-0000-000002026060", "full_name": "Kerem Çakır" },
    { "id": "00000000-0000-0000-0000-000002026061", "full_name": "Elif Çakır" },
    { "id": "00000000-0000-0000-0000-000002026062", "full_name": "Sude Polat" },
    { "id": "00000000-0000-0000-0000-000002026063", "full_name": "Tuna Aydın" },
    { "id": "00000000-0000-0000-0000-000002026064", "full_name": "Zeynep Şahin" },
    { "id": "00000000-0000-0000-0000-000002026065", "full_name": "Gizem Erdoğan" },
    { "id": "00000000-0000-0000-0000-000002026066", "full_name": "Emre Şimşek" },
    { "id": "00000000-0000-0000-0000-000002026067", "full_name": "Çınar Çelik" },
    { "id": "00000000-0000-0000-0000-000002026068", "full_name": "Kerem Acar" },
    { "id": "00000000-0000-0000-0000-000002026069", "full_name": "Kerem Şahin" },
    { "id": "00000000-0000-0000-0000-000002026070", "full_name": "Berk Gül" },
    { "id": "00000000-0000-0000-0000-000002026071", "full_name": "Yiğit Arslan" },
    { "id": "00000000-0000-0000-0000-000002026072", "full_name": "Esra Erdoğan" },
    { "id": "00000000-0000-0000-0000-000002026073", "full_name": "Can Kaya" },
    { "id": "00000000-0000-0000-0000-000002026074", "full_name": "Selin Kılıç" },
    { "id": "00000000-0000-0000-0000-000002026075", "full_name": "Berk Güler" },
    { "id": "00000000-0000-0000-0000-000002026076", "full_name": "Fatma Öztürk" },
    { "id": "00000000-0000-0000-0000-000002026077", "full_name": "Çınar Güler" },
    { "id": "00000000-0000-0000-0000-000002026078", "full_name": "Ece Doğan" },
    { "id": "00000000-0000-0000-0000-000002026079", "full_name": "Mustafa Kara" },
    { "id": "00000000-0000-0000-0000-000002026080", "full_name": "Ada Özkan" }
];

function generateMigration() {
    console.log('Generating chunked SQL migration script...');

    const chunkSize = 10;
    const emailMap = new Map<string, number>();

    // Make output directory
    if (!fs.existsSync('supabase/migrations_generated')) {
        fs.mkdirSync('supabase/migrations_generated');
    }

    let chunkIndex = 0;

    for (let i = 0; i < profiles.length; i += chunkSize) {
        chunkIndex++;
        const chunk = profiles.slice(i, i + chunkSize);

        let sqlOutput = `-- Migration Chunk ${chunkIndex} generated at ${new Date().toISOString()}\n`;
        sqlOutput += `
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
`;

        for (const student of chunk) {
            const fullName = student.full_name || 'Unknown Student';
            let baseEmail = generateEmail(fullName);

            if (emailMap.has(baseEmail)) {
                const count = emailMap.get(baseEmail)! + 1;
                emailMap.set(baseEmail, count);
                baseEmail = baseEmail.replace('@cervus.test', `.${count}@cervus.test`);
            } else {
                emailMap.set(baseEmail, 1);
            }

            const email = baseEmail;
            const oldId = student.id;

            const safeFullName = fullName.replace(/'/g, "''");
            const safeEmail = email.replace(/'/g, "''");

            sqlOutput += `
    ----------------------------------------------------------------
    -- Migrating ${safeFullName}
    ----------------------------------------------------------------
    v_email := '${safeEmail}';
    v_full_name := '${safeFullName}';
    v_old_id := '${oldId}';
    
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
`;
        }

        sqlOutput += `
END $$;
`;
        fs.writeFileSync(`supabase/migrations_generated/migration_chunk_${chunkIndex}.sql`, sqlOutput);
        console.log(`Generated chunk ${chunkIndex}`);
    }
}

generateMigration();
