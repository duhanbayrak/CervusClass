import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key')
    process.exit(1)
}

// Admin Client (for setup/cleanup)
const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function testStudentDataIsolation(
    supabaseUrl: string,
    passStudent: string
): Promise<{ passed: number; failed: number }> {
    console.log('\n--- TC_SEC_003: Student Data Isolation ---')
    const emailStudent = 'barisozturk@cervus.com'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    const studentClient = createSupabaseClient(supabaseUrl, anonKey)
    const { data: { session: studentSession }, error: loginError } = await studentClient.auth.signInWithPassword({
        email: emailStudent,
        password: passStudent
    })

    if (loginError || !studentSession) {
        console.error('Student Login Failed:', loginError?.message)
        return { passed: 0, failed: 1 }
    }

    console.log('Student Logged In:', studentSession.user.id)
    const { data: results, error: fetchError } = await studentClient.from('exam_results').select('student_id')

    if (fetchError) {
        console.error('Error fetching exam results:', fetchError)
        return { passed: 0, failed: 1 }
    }

    const otherStudents = results.filter((r: Record<string, unknown>) => r.student_id !== studentSession.user.id)
    if (otherStudents.length > 0) {
        console.error(`FAIL: Student accessed ${otherStudents.length} records of others!`)
        return { passed: 0, failed: 1 }
    }

    console.log(`PASS: Student see only their own records (Total: ${results.length})`)

    const invalidPassword = process.env.TEST_INVALID_PASSWORD ?? 'test-invalid-pw'
    const { error: invalidError } = await studentClient.auth.signInWithPassword({
        email: emailStudent,
        password: invalidPassword
    })

    if (invalidError?.message === 'Invalid login credentials') {
        console.log('PASS: Correct error for invalid credentials')
        return { passed: 2, failed: 0 }
    }

    console.error('FAIL: Unexpected behavior for invalid login:', invalidError)
    return { passed: 1, failed: 1 }
}

async function testTeacherAccessControl(
    supabaseUrl: string,
    passTea: string
): Promise<{ passed: number; failed: number }> {
    console.log('\n--- TC_SEC_002: Teacher Access Control ---')
    const emailTea = 'cervusteacher@gmail.com'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    const teacherClient = createSupabaseClient(supabaseUrl, anonKey)
    const { data: { session: teacherSession }, error: tLoginError } = await teacherClient.auth.signInWithPassword({
        email: emailTea,
        password: passTea
    })

    if (tLoginError || !teacherSession) {
        console.error('Teacher Login Failed:', tLoginError?.message)
        return { passed: 0, failed: 1 }
    }

    console.log('Teacher Logged In:', teacherSession.user.id)
    const { error: insertError } = await teacherClient
        .from('classes')
        .insert({ name: 'Hacker Class', grade: 12, organization_id: '283442f5-d8c2-45da-94be-0c3770c96870' })

    if (insertError) {
        console.log(`PASS: Teacher cannot create class (Error: ${insertError.message})`)
        return { passed: 1, failed: 0 }
    }

    console.error('FAIL: Teacher was able to create a class!')
    await adminClient.from('classes').delete().eq('name', 'Hacker Class')
    return { passed: 0, failed: 1 }
}

async function runTests() {
    console.log('Starting Security & RLS Tests...')

    const passStudent = process.env.TEST_STUDENT_PASSWORD
    if (!passStudent) throw new Error('Missing TEST_STUDENT_PASSWORD env variable')
    const passTea = process.env.TEST_TEACHER_PASSWORD
    if (!passTea) throw new Error('Missing TEST_TEACHER_PASSWORD env variable')

    let passed = 0
    let failed = 0

    try {
        const studentResult = await testStudentDataIsolation(supabaseUrl!, passStudent)
        passed += studentResult.passed
        failed += studentResult.failed

        const teacherResult = await testTeacherAccessControl(supabaseUrl!, passTea)
        passed += teacherResult.passed
        failed += teacherResult.failed

    } catch (err) {
        console.error('Test Suite Error:', err)
        failed++
    }

    console.log(`\n=== TEST SUMMARY ===`)
    console.log(`PASSED: ${passed}`)
    console.log(`FAILED: ${failed}`)
}

await runTests()
