
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

const TARGET_EMAIL = 'ahmet.ozkan@cervus.test'
const PASSWORD = '123456'

async function recreateUser() {
    console.log(`--- RECREATING USER: ${TARGET_EMAIL} ---`)

    // 1. Find existing user to get metadata
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

    // (If listUsers fails, use SQL fallback logic previously implemented or assume defaults)
    // But since listUsers has been flaky, I will hardcode metadata based on previous SQL SELECT

    const userMetadata = {
        full_name: "Ahmet Özkan",
        // Add other fields if known/needed
    }
    const appMetadata = {
        role: "student",
        class_id: "14657558-7f6d-4d87-b041-37cb80a7a779", // From previous SQL check
        organization_id: "283442f5-d8c2-45da-94be-0c3770c96870"
    }

    console.log('Using Metadata:', { userMetadata, appMetadata })

    // 2. Delete existing user (Cascade will handle profile/results)
    // First, get ID by email (if listUsers fails, try deleteUser by ID if known, or get ID via listUsers fallback)
    // I know the ID: 092cd2db-d1de-40ba-a89d-3c0cc5703649
    const KNOWN_ID = '092cd2db-d1de-40ba-a89d-3c0cc5703649'

    console.log(`Deleting ID: ${KNOWN_ID}...`)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(KNOWN_ID)

    if (deleteError) {
        console.error('Delete Error (ignoring if not found):', deleteError.message)
    } else {
        console.log('User Deleted.')
    }

    // 3. Create fresh user
    console.log('Creating fresh user...')
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: userMetadata,
        app_metadata: appMetadata
    })

    if (createError) {
        console.error('CRITICAL: Create Failed:', createError)
        return
    }

    console.log(`User Created! ID: ${newUser.user.id}`)

    // 4. Ensure Profile
    // (Function on_signup usually handles this, or maybe migration script did. 
    // If auto-create trigger exists, it should be there. If not, manual insert.)

    const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', newUser.user.id)
        .single()

    if (!profile) {
        console.log('Profile missing (trigger might be off). Inserting manually...')
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: newUser.user.id,
                email: TARGET_EMAIL,
                full_name: userMetadata.full_name,
                role: appMetadata.role,
                class_id: appMetadata.class_id,
                organization_id: appMetadata.organization_id,
                updated_at: new Date().toISOString()
            })

        if (profileError) console.error('Profile Insert Error:', profileError)
        else console.log('Profile Inserted.')
    } else {
        console.log('Profile exists automatically.')
    }

    console.log('--- DONE ---')
}

recreateUser()
