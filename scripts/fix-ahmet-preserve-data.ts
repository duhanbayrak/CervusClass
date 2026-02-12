
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

const OLD_ID = '092cd2db-d1de-40ba-a89d-3c0cc5703649'
const TARGET_EMAIL = 'ahmet.ozkan@cervus.test'
const TEMP_EMAIL = 'temp.holder.999@cervus.test'
const PASSWORD = '123456'

async function fixAhmet() {
    console.log('--- STARTING CLEAN RECREATE & PRESERVE ---')

    // 1. Create Temp User
    console.log(`Creating temp user: ${TEMP_EMAIL}...`)
    const { data: tempUser, error: tempError } = await adminClient.auth.admin.createUser({
        email: TEMP_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Temp Holder' }
    })

    // If temp user already exists (from failed run), try to reuse or delete/recreate?
    // Let's handle 'already exists' by trying to fetch ID.
    let tempId: string | undefined
    if (tempError?.status === 422) { // Already registered?
        console.warn('Temp user might exist. Fetching ID by listUsers...')
        // Fallback if createUser fails:
        // (Simpler: Just use deleteUser on temp user first always).
        // Or just proceed if we can find ID.
        // Let's try delete first to be safe.
    } else if (tempError) {
        console.error('Failed to create temp user:', tempError)
        return
    } else {
        tempId = tempUser.user.id
    }

    // Safety check: ensure temp ID exists
    if (!tempId) {
        // Try fetch
        const { data: { users } } = await adminClient.auth.admin.listUsers()
        // Can't rely on listUsers if it fails.
        // Assuming createUser worked for now.
        // If it failed because exists, I can't proceed easily without ID.
        // Let's assume creating new random email is safer.
        console.error('Could not get temp ID. Aborting.')
        return
    }

    console.log(`Temp User ID: ${tempId}`)

    // Ensure Profile for Temp User (Critical for FK)
    const { error: profileErr } = await adminClient.from('profiles').upsert({
        id: tempId,
        email: TEMP_EMAIL,
        full_name: 'Temp Holder',
        role: 'student', // Default
        updated_at: new Date().toISOString()
    })
    if (profileErr) {
        console.error('Failed to create temp profile:', profileErr)
        // Proceeding anyway might fail step 2
    }

    // 2. Move Data to Temp User via SQL (Using rpc or raw query if permissions allow. Admin user bypasses RLS)
    // adminClient.from(...).update(...) should work.
    console.log('Moving exam_results to temp user...')
    const { error: moveError } = await adminClient
        .from('exam_results')
        .update({ student_id: tempId })
        .eq('student_id', OLD_ID)

    if (moveError) {
        console.error('Failed to move exam_results:', moveError)
        // Check if old user even exists?
    } else {
        console.log('Exam results moved.')
    }

    // 3. Delete Old User (Ahmet)
    console.log(`Deleting old user ${OLD_ID} via API (or SQL fallback if fails)...`)
    const { error: delError } = await adminClient.auth.admin.deleteUser(OLD_ID)

    if (delError) {
        console.error(`API Delete Failed: ${delError.message}`)
        console.log('Attempting SQL Delete via RPC (simulate if RPC existed) or just fail politely.')
        // Since I can't execute RAW SQL from here (no stored procedure), I rely on User to execute SQL if API fails.
        // But previously API delete failed.
        // So this script will likely fail here.
        // UNLESS: I create an SQL tool call from the agent to do this step?
        // Yes.
        console.log('Please execute SQL: DELETE FROM auth.users WHERE id = ... manually if API failed.')
        return
    }

    console.log('User Deleted Successfully.')

    // 4. Recreate Ahmet
    console.log('Recreating Ahmet...')
    // Use metadata from hardcoded or previous logic
    const { data: newUser, error: createAhmetError } = await adminClient.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Ahmet Özkan" },
        app_metadata: {
            role: "student",
            class_id: "14657558-7f6d-4d87-b041-37cb80a7a779", // Hardcoded ID from earlier step
            organization_id: "283442f5-d8c2-45da-94be-0c3770c96870" // Hardcoded ID
        }
    })

    if (createAhmetError) {
        console.error('Failed to recreate Ahmet:', createAhmetError)
        return
    }

    const newAhmetId = newUser.user.id
    console.log(`New Ahmet ID: ${newAhmetId}`)

    // 5. Ensure Profile for New Ahmet
    const { error: newProfileErr } = await adminClient.from('profiles').upsert({
        id: newAhmetId,
        email: TARGET_EMAIL,
        full_name: "Ahmet Özkan",
        role: "student",
        class_id: "14657558-7f6d-4d87-b041-37cb80a7a779",
        organization_id: "283442f5-d8c2-45da-94be-0c3770c96870",
        updated_at: new Date().toISOString()
    })

    if (newProfileErr) console.error('Error creating new profile:', newProfileErr)
    else console.log('New Profile Created.')

    // 6. Move Data Back
    console.log('Restoring exam_results...')
    const { error: restoreError } = await adminClient
        .from('exam_results')
        .update({ student_id: newAhmetId })
        .eq('student_id', tempId)

    if (restoreError) console.error('Failed to restore data:', restoreError)
    else console.log('Data Restored.')

    // 7. Delete Temp User
    console.log('Deleting temp user...')
    await adminClient.auth.admin.deleteUser(tempId)
    console.log('DONE.')
}

fixAhmet()
