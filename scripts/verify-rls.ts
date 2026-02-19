
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key')
    process.exit(1)
}

// Admin Client (for setup/cleanup)
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function runTests() {
    console.log('Starting Security & RLS Tests...')
    let passed = 0
    let failed = 0

    try {
        // 0. Setup: Get Test Users
        console.log('\n--- Setup ---')
        // We expect these users to exist from previous phases or we verify their roles
        const emailStudent = 'barisozturk@cervus.com'
        const passStudent = '123456'

        const emailTea = 'cervusteacher@gmail.com'
        const passTea = '123456'

        const emailAdmin = 'admin@cervus.com'
        const passAdmin = 'admin123'

        // 1. TC_SEC_001: Student accessing Admin Data (e.g. users table via RPC or direct select if possible, generally restricted)
        // Actually, checking if they can select from a table they shouldn't, like 'profiles' of other orgs or 'secrets' if any.
        // Better check: Can student see other students' grades?

        console.log('\n--- TC_SEC_003: Student Data Isolation ---')
        const studentClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        const { data: { session: studentSession }, error: loginError } = await studentClient.auth.signInWithPassword({
            email: emailStudent,
            password: passStudent
        })

        if (loginError) {
            console.error('Student Login Failed:', loginError.message)
            failed++
        } else {
            console.log('Student Logged In:', studentSession.user.id)

            // Try to fetch ALL exam results (RLS should restrict to only their own)
            const { data: results, error: fetchError } = await studentClient
                .from('exam_results')
                .select('student_id')

            if (fetchError) {
                console.error('Error fetching exam results:', fetchError)
            } else {
                const otherStudents = results.filter((r: any) => r.student_id !== studentSession.user.id)
                if (otherStudents.length > 0) {
                    console.error(`FAIL: Student accessed ${otherStudents.length} records of others!`)
                    failed++
                } else {
                    console.log(`PASS: Student see only their own records (Total: ${results.length})`)
                    passed++
                }
            }
        }

        // 2. TC_SEC_002: Teacher accessing Admin Data
        console.log('\n--- TC_SEC_002: Teacher Access Control ---')
        const teacherClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        const { data: { session: teacherSession }, error: tLoginError } = await teacherClient.auth.signInWithPassword({
            email: emailTea,
            password: passTea
        })

        if (tLoginError) {
            console.error('Teacher Login Failed:', tLoginError.message)
            failed++
        } else {
            console.log('Teacher Logged In:', teacherSession.user.id)
            // Teacher SHOULD see students in their classes
            // But Teacher SHOULD NOT be able to delete a Class (Admin only)

            // Try to delete a random class (mock ID or one that exists)
            // We won't actually delete a real one, we'll try to insert a class (Admin only usually)
            // Or update a critical table

            const { error: insertError } = await teacherClient
                .from('classes')
                .insert({ name: 'Hacker Class', grade: 12, organization_id: '283442f5-d8c2-45da-94be-0c3770c96870' })

            if (insertError) {
                console.log(`PASS: Teacher cannot create class (Error: ${insertError.message})`)
                passed++
            } else {
                console.error('FAIL: Teacher was able to create a class!')
                // Cleanup if it actually worked
                await adminClient.from('classes').delete().eq('name', 'Hacker Class')
                failed++
            }
        }

        // 3. TC_AUTH_004: Invalid Login
        console.log('\n--- TC_AUTH_004: Invalid Login Handling ---')
        const { error: invalidError } = await studentClient.auth.signInWithPassword({
            email: emailStudent,
            password: 'wrongpassword'
        })

        if (invalidError && invalidError.message === 'Invalid login credentials') {
            console.log('PASS: Correct error for invalid credentials')
            passed++
        } else {
            console.error('FAIL: Unexpected behavior for invalid login:', invalidError)
            failed++
        }

    } catch (err) {
        console.error('Test Suite Error:', err)
        failed++
    }

    console.log(`\n=== TEST SUMMARY ===`)
    console.log(`PASSED: ${passed}`)
    console.log(`FAILED: ${failed}`)
}

runTests()
