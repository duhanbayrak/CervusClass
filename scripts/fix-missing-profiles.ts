
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

async function fixMissingProfiles() {
    console.log('--- SCANNING FOR MISSING PROFILES ---')

    // 1. Get all Auth Users
    // (For large DBs, paginate. Here assumes < 1000 for simplicity or uses pages)
    let allUsers: any[] = []
    let page = 1
    const PER_PAGE = 50
    while (true) {
        const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage: PER_PAGE })
        if (error || !users || users.length === 0) break
        allUsers = [...allUsers, ...users]
        if (users.length < PER_PAGE) break
        page++
    }
    console.log(`Total Auth Users: ${allUsers.length}`)

    // 2. Scan each user
    let modified = 0
    for (const user of allUsers) {
        // Check if profile exists
        const { data: profile, error } = await adminClient
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = JSON mismatch or 0 rows (single())
            console.error(`Error checking profile for ${user.email}`, error)
            continue
        }

        if (!profile) {
            console.log(`MISSING PROFILE: ${user.email} (${user.id})`)

            // Reconstruct User Data
            const metadata = user.user_metadata || {}
            const app_metadata = user.app_metadata || {}

            const newProfile = {
                id: user.id,
                email: user.email,
                full_name: metadata.full_name || 'Unknown User',
                role: app_metadata.role || 'student', // Default to student
                organization_id: app_metadata.organization_id || null, // Critical for RLS
                class_id: app_metadata.class_id ? parseInt(app_metadata.class_id) : null,
                // Add specific fields if available
                avatar_url: metadata.avatar_url || null,
                updated_at: new Date().toISOString()
            }

            // Correct class_id type if needed (UUID vs Int) - Check schema?
            // Assuming class_id is UUID in auth meta but might be different in profiles? 
            // In migration scripts it was UUID.
            // Let's safe cast or keep as is.
            if (app_metadata.class_id) {
                newProfile.class_id = app_metadata.class_id
            }

            console.log(`  -> Creating profile...`)
            const { error: insertError } = await adminClient
                .from('profiles')
                .insert(newProfile)

            if (insertError) {
                console.error(`  FAILED: ${insertError.message}`)
            } else {
                console.log(`  FIXED!`)
                modified++
            }
        }
    }

    console.log('--- SCAN COMPLETE ---')
    console.log(`Profiles Created: ${modified}`)
}

fixMissingProfiles()
