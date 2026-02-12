
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function runTest() {
    const email = `test.user.${Date.now()}@cervus.test`
    const password = 'password123'

    console.log(`Creating user: ${email}`)

    // Create user as Admin
    const { data: user, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Test User' },
        app_metadata: { role: 'student', organization_id: '283442f5-d8c2-45da-94be-0c3770c96870' } // Using Ada's org ID
    })

    if (createError) {
        console.error('Create User Failed:', createError)
        return
    }

    console.log('User created successfully:', user.user.id)

    // Try Login as Anon
    console.log('Attempting login...')
    const { data: session, error: loginError } = await anonClient.auth.signInWithPassword({
        email,
        password
    })

    if (loginError) {
        console.error('Login Failed:', loginError)
    } else {
        console.log('Login Successful!')
        console.log('Session Access Token:', session.session?.access_token.substring(0, 10))
    }

    // Cleanup
    console.log('Cleaning up...')
    await adminClient.auth.admin.deleteUser(user.user.id)
    console.log('User deleted.')
}

runTest()
