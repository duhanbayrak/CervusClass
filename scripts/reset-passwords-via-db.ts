
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

const NEW_PASSWORD = '123456'

async function resetPasswords() {
    console.log('--- RESETTING PASSWORDS ---')

    // 1. Get ALL User IDs from profiles table (since Auth API listing is flaky)
    console.log('Fetching user list from profiles...')

    // We only want users who are linked to auth, so we select the 'id' which is technically the auth.uid
    const { data: profiles, error: profileError } = await adminClient
        .from('profiles')
        .select('id, email')
    // .limit(1000) // Optional limit

    if (profileError) {
        console.error('CRITICAL: Could not fetch profiles:', profileError)
        return
    }

    if (!profiles || profiles.length === 0) {
        console.log('No profiles found.')
        return
    }

    console.log(`Found ${profiles.length} profiles. Attempting password update...`)

    let success = 0
    let failed = 0

    // 2. Loop and Update via Admin API
    for (const p of profiles) {
        process.stdout.write(`Updating ${p.email}... `)

        try {
            const { error: updateError } = await adminClient.auth.admin.updateUserById(
                p.id,
                { password: NEW_PASSWORD }
            )

            if (updateError) {
                console.log(`FAILED: ${updateError.message}`)
                failed++
            } else {
                console.log('OK')
                success++
            }
        } catch (e: any) {
            console.log(`EXCEPTION: ${e.message}`)
            failed++
        }
    }

    console.log('\n--- SUMMARY ---')
    console.log(`Total: ${profiles.length}`)
    console.log(`Success: ${success}`)
    console.log(`Failed: ${failed}`)
}

resetPasswords()
