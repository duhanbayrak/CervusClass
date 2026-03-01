
const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('node:path')

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key')
    process.exit(1)
}

const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function resetPassword() {
    const email = 'barisozturk@cervus.com'
    const newPassword = process.env.TEST_STUDENT_PASSWORD
    if (!newPassword) {
        console.error('Missing TEST_STUDENT_PASSWORD env variable')
        process.exit(1)
    }

    console.log(`Resetting password for ${email}...`)

    // First, find the user to get ID because listUsers might be paginated
    // But let's try direct update by email if possible? No, updateUserById needs ID.
    // We'll trust listUsers finds it if it's there.

    const { data: { users }, error: findError } = await supabase.auth.admin.listUsers()

    if (findError) {
        console.error('Error listing users:', findError)
        return
    }

    const user = users.find((u: any) => u.email === email)

    if (!user) {
        console.error(`User ${email} not found!`)
        // If not found, create it?
        // No, better to fail and investigate.
        return
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    )

    if (error) {
        console.error('Error updating password:', error)
    } else {
        console.log('Password updated successfully for user:', data.user.id)
    }
}

await resetPassword()

export { }
