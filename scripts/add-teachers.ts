
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTeachers() {
    console.log('Adding teachers...');

    // 1. Get Teacher Role
    const { data: role } = await supabase.from('roles').select('id').eq('name', 'teacher').single();
    if (!role) throw new Error('Teacher role not found');

    // 2. Get Organization (Assume first org found or specific)
    // We'll use the one from existing profiles to be safe
    const { data: existingProfile } = await supabase.from('profiles').select('organization_id').limit(1).single();
    const orgId = existingProfile?.organization_id;
    if (!orgId) throw new Error('Organization not found');

    // 3. Define new teachers
    const newTeachers = [
        { name: 'Kemal Sunal', branch: 'Fizik' },
        { name: 'Halide Edib', branch: 'Tarih' },
        { name: 'Piri Reis', branch: 'Coğrafya' },
        { name: 'Can Yücel', branch: 'İngilizce' },
        { name: 'Nazım Hikmet', branch: 'Türk Dili ve Edebiyatı' },
        { name: 'Mevlana', branch: 'Din Kültürü ve Ahlak Bilgisi' },
        { name: 'Sokrates', branch: 'Felsefe' },
        { name: 'Sigmund Freud', branch: 'Psikoloji' },
        { name: 'Naim Süleymanoğlu', branch: 'Beden Eğitimi ve Spor' },
    ];

    // 4. Get Branches
    const { data: branches } = await supabase.from('branches').select('id, name');
    if (!branches) throw new Error('Branches not found');

    const profilesToAdd: any[] = [];

    for (const t of newTeachers) {
        const branch = branches.find(b => b.name === t.branch);
        if (branch) {
            profilesToAdd.push({
                id: crypto.randomUUID(), // Generate UUID
                full_name: t.name,
                email: `${t.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')}@cervus.com`,
                role_id: role.id,
                organization_id: orgId,
                branch_id: branch.id,
                // Add default dummy password hash if needed? 
                // Supabase Auth usually handles user creation.
                // NOTE: Creating profile directly usually requires a matching User in auth.users if trigger exists.
                // However, often for testing we might just insert profile if constraints allow, OR we use Admin API to create user.
            });
        }
    }

    // Checking if we need to create Auth Users first.
    // Usually yes.
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();

    for (const p of profilesToAdd) {
        // Check if user exists (by email)
        const email = p.email;
        let userId = p.id;

        // Try to create auth user
        const { data: user, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: 'password123',
            email_confirm: true,
            user_metadata: {
                full_name: p.full_name,
                role: 'teacher',
                organization_id: orgId
            },
            app_metadata: {
                role: 'teacher',
                organization_id: orgId
            }
        });

        if (createError) {
            console.log(`User ${email} might already exist:`, createError.message);
            // Implement simple find mechanism
            // Ideally use getUserByEmail if available in admin api, or filtering listUsers
            const { data: foundUser, error: findError } = await supabase.rpc('get_user_id_by_email', { email_input: email }); // RPC not guaranteed to exist

            // Allow failover to check listUsers if we can't find it easily, but ListUsers is paginated.
            // Let's assume for this one-off script we can just fail if they exist, OR we can try to fetch them.
            // Actually, we can just select from profiles if they exist there too.
            const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', email).single();
            if (existingProfile) {
                userId = existingProfile.id;
                console.log(`Found existing profile ID for ${email}: ${userId}`);
            } else {
                console.warn(`Could not find ID for existing user ${email}. Skipping profile upsert to avoid mismatch.`);
                continue;
            }
        } else {
            console.log(`Created Auth User: ${email}`);
            userId = user.user.id;
        }

        // Now upsert profile
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: p.full_name,
            role_id: role.id,
            organization_id: orgId,
            branch_id: p.branch_id,
            email: email
        });

        if (profileError) console.error('Profile Upsert Error:', profileError);
        else console.log(`Upserted Profile: ${p.full_name}`);
    }
}

addTeachers().catch(console.error);
