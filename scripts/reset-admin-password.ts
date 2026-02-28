
const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

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
    const userId = '57da9bef-d287-445c-ab1a-1a13fa5bf3bb'
    const newPassword = process.env.TEST_ADMIN_PASSWORD
    if (!newPassword) {
        console.error('Missing TEST_ADMIN_PASSWORD env variable')
        process.exit(1)
    }

    console.log(`Resetting password for user ${userId}...`)

    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    )

    if (error) {
        console.error('Error updating password:', error)
    } else {
        console.log('Password updated successfully for user:', data.user.id)
    }
}

resetPassword()

export { }
