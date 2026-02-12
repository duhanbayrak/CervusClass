
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testLogin() {
    console.log('Attempting login for: ada.ozkan@cervus.test')

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ada.ozkan@cervus.test',
        password: '123456'
    })

    if (error) {
        console.error('Login Failed with Error:', error)
        console.error('Error Message:', error.message)
        console.error('Error Status:', error.status)
        console.error('Error Name:', error.name)
    } else {
        console.log('Login Successful!')
        console.log('User ID:', data.user.id)
        console.log('Session Access Token:', data.session?.access_token.substring(0, 10) + '...')
    }
}

testLogin()
