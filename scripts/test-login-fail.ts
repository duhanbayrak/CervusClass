
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testLogin() {
    console.log('Attempting login for: ahmet.ozkan@cervus.test')

    // Explicitly using the password we set for everyone
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ahmet.ozkan@cervus.test',
        password: '123456'
    })

    if (error) {
        console.error('Login Failed with Error:', error)
        console.error('Status:', error.status)
        console.error('Name:', error.name)
        console.error('Message:', error.message)
    } else {
        console.log('Login Successful!')
        console.log('User ID:', data.user.id)
    }
}

testLogin()
