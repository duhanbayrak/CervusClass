
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NEW_PASSWORD = '123456'

async function resetAllPasswords() {
    console.log('--- STARTING BULK PASSWORD RESET ---')

    // 1. Fetch Users in Batches
    let allUsers: any[] = []
    let page = 1
    const perPage = 50
    let hasMore = true

    while (hasMore) {
        console.log(`Fetching page ${page}...`)
        const { data: { users }, error } = await adminClient.auth.admin.listUsers({
            page: page,
            perPage: perPage
        })

        if (error) {
            console.error('CRITICAL ERROR fetching users:', error)
            break
        }

        if (!users || users.length === 0) {
            hasMore = false
        } else {
            console.log(`Adding ${users.length} users to list.`)
            allUsers = [...allUsers, ...users]
            if (users.length < perPage) hasMore = false
            else page++
        }
    }

    console.log(`\nFound total ${allUsers.length} users. Starting updates...\n`)

    let successCount = 0
    let failCount = 0

    // 2. Iterate and Update
    for (const user of allUsers) {
        try {
            console.log(`Updating ${user.email}...`)
            const { error: updateError } = await adminClient.auth.admin.updateUserById(
                user.id,
                { password: NEW_PASSWORD }
            )

            if (updateError) {
                console.error(`  FAILED: ${updateError.message}`)
                failCount++
            } else {
                console.log(`  SUCCESS`)
                successCount++
            }
        } catch (err: any) {
            console.error(`  EXCEPTION: ${err.message}`)
            failCount++
        }
    }

    console.log('\n--- OPERATION COMPLETE ---')
    console.log(`Total Users: ${allUsers.length}`)
    console.log(`Updated: ${successCount}`)
    console.log(`Failed: ${failCount}`)
}

resetAllPasswords()
