
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TARGET_EMAIL = 'ada.ozkan@cervus.test'
const TARGET_PASSWORD = '123456'

async function tryFix() {
    console.log('--- STARTING FIX ---')

    // 1. Fetch User ID
    const { data: { users } } = await adminClient.auth.admin.listUsers()
    const existingApiUser = users.find(u => u.email === TARGET_EMAIL)

    if (existingApiUser) {
        const userId = existingApiUser.id
        console.log(`Found User: ${userId}. Proceeding to clean up dependencies...`)

        // 2. Clean Dependencies Manually (Since CASCADE is missing/failing)

        // Delete Study Sessions
        const { error: ssError } = await adminClient
            .from('study_sessions')
            .delete()
            .eq('student_id', userId)
        if (ssError) console.error('Error deleting study_sessions:', ssError)
        else console.log('Cleaned study_sessions')

        // Delete Exam Results
        const { error: erError } = await adminClient
            .from('exam_results')
            .delete()
            .eq('student_id', userId)
        if (erError) console.error('Error deleting exam_results:', erError)
        else console.log('Cleaned exam_results')

        // Delete Homework Submissions (if any - not sure of table name, guessing or skipping if not critical)
        // Checking for 'homework_submissions' table?
        // Let's assume just basic tables for now or try deleting profiles next.

        // 3. Delete Profile Manually (to ensure it's gone)
        const { error: pError } = await adminClient
            .from('profiles')
            .delete()
            .eq('id', userId)
        if (pError) console.error('Error deleting profile:', pError)
        else console.log('Cleaned profile')

        // 4. Delete Auth User
        const { error: uError } = await adminClient.auth.admin.deleteUser(userId)
        if (uError) console.error('Delete User Error:', uError)
        else console.log('User Deleted via API.')

    } else {
        console.log('User not found via listUsers API. Proceeding to create.')
    }

    // 5. Create User Fresh
    console.log('Creating User Fresh...')
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Ada Özkan' },
        app_metadata: {
            role: 'student',
            organization_id: '283442f5-d8c2-45da-94be-0c3770c96870',
            provider: 'email',
            providers: ['email']
        }
    })

    if (createError) {
        console.error('CRITICAL: Create User Failed:', createError)
        return
    }

    console.log('User Created:', newUser.user.id)

    // 6. Link Profile
    const profileInsert = {
        id: newUser.user.id,
        email: TARGET_EMAIL,
        full_name: 'Ada Özkan',
        organization_id: '283442f5-d8c2-45da-94be-0c3770c96870',
        role_id: '380914a0-783e-4300-8fb7-b55c81f575b7', // Student Role ID
        class_id: '14657558-7f6d-4d87-b041-37cb80a7a779', // 12-A
        student_number: '2026001'
    }

    const { error: insertError } = await adminClient.from('profiles').insert(profileInsert)
    if (insertError) {
        console.error('Insert Profile Failed:', insertError)
    } else {
        console.log('Profile Inserted Successfully.')
    }

    // 7. Test Login
    console.log('Testing Login...')
    const { data: session, error: loginError } = await anonClient.auth.signInWithPassword({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD
    })

    if (loginError) {
        console.error('Login Failed:', loginError)
    } else {
        console.log('LOGIN SUCCESS! Token:', session.session?.access_token.substring(0, 10))
    }
}

tryFix()
