
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyAdminLogin() {
    console.log('Attempting login as admin@cervus.com...')

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@cervus.com',
        password: 'admin123',
    })

    if (error) {
        console.error('Login failed:', error.message)
        console.error('Error details:', error)
        return
    }

    console.log('Login successful!')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)

    // Verify profile access
    console.log('Fetching profile...')
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

    if (profileError) {
        console.error('Failed to fetch profile:', profileError.message)
        console.error('Profile Error details:', profileError)
    } else {
        console.log('Profile fetched successfully:', profile.full_name)
        console.log('Role:', profile.role)
        console.log('Org ID:', profile.organization_id)
    }
}

verifyAdminLogin()
