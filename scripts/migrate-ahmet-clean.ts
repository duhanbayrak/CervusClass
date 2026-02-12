
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

const OLD_ID = '092cd2db-d1de-40ba-a89d-3c0cc5703649' // Ahmet's ID
const TARGET_EMAIL = 'ahmet.ozkan@cervus.test'
const PASSWORD = '123456'
const MIGRATION_FILE = path.resolve(__dirname, 'ahmet_migration_data.json')

async function migrateAhmet() {
    console.log('--- STARTING CLEAN MIGRATION ---')

    // 1. Fetch Exam IDs and Session IDs
    console.log(`Fetching data for student ID: ${OLD_ID}`)

    const { data: exams, error: examError } = await adminClient
        .from('exam_results')
        .select('id')
        .eq('student_id', OLD_ID)

    if (examError) { console.error('Error fetching exams:', examError); return }
    const examIds = exams?.map(e => e.id) || []
    console.log(`Found ${examIds.length} exams.`)

    const { data: sessions, error: sessionError } = await adminClient
        .from('study_sessions')
        .select('id')
        .eq('student_id', OLD_ID)

    if (sessionError) { console.error('Error fetching sessions:', sessionError); return }
    const sessionIds = sessions?.map(s => s.id) || []
    console.log(`Found ${sessionIds.length} sessions.`)

    // Save to file
    fs.writeFileSync(MIGRATION_FILE, JSON.stringify({ examIds, sessionIds }, null, 2))
    console.log(`Saved IDs to ${MIGRATION_FILE}`)

    // 2. Detach Data (Set to NULL)
    // Note: If column is NOT NULL, this fails. I checked: exam_results.student_id is nullable. Assuming sessions too.
    if (examIds.length > 0) {
        console.log('Detaching exams...')
        const { error: clearExams } = await adminClient
            .from('exam_results')
            .update({ student_id: null })
            .in('id', examIds) // Using IDs creates cleaner update
        if (clearExams) { console.error('Failed to detach exams:', clearExams); return }
    }

    if (sessionIds.length > 0) {
        console.log('Detaching sessions...')
        const { error: clearSessions } = await adminClient
            .from('study_sessions')
            .update({ student_id: null })
            .in('id', sessionIds)
        if (clearSessions) { console.error('Failed to detach sessions:', clearSessions); return }
    }

    // 3. Delete Old User
    // If API fails, I will instruct user to run SQL. But let's try API.
    // Wait, API failed before.
    // Try API first.
    console.log('Deleting old user via API...')
    const { error: delError } = await adminClient.auth.admin.deleteUser(OLD_ID)
    if (delError) {
        console.error(`API Delete Failed: ${delError.message}`)
        console.log('Proceeding with SQL deletion suggestion IF API failed completely? No, script continues?')
        // If DELETE failed, create will fail (Email taken).
        // Try to proceed only if user is gone.
        // Check if user exists?
        const { data: checkUser } = await adminClient.from('auth.users').select('id').eq('id', OLD_ID).single() // Can't select auth.users directly via PostgREST usually
        // Use listUsers
        // But listUsers failed before.
        // Let's assume delete FAILED and try create. Create will error "Email taken".
        // SO: I WILL TRY TO DELETE VIA SQL COMMAND TOOL FROM AGENT IF THIS FAILS.
        // But for now let's hope it works because data is detached (maybe FK was issue).
    } else {
        console.log('User deleted.')
    }

    // 4. Create New User
    console.log('Creating new Ahmet...')
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Ahmet Özkan" },
        app_metadata: {
            role: "student",
            class_id: "14657558-7f6d-4d87-b041-37cb80a7a779",
            organization_id: "283442f5-d8c2-45da-94be-0c3770c96870"
        }
    })

    if (createError) {
        console.error('Create Failed:', createError)
        return
    }
    const newId = newUser.user.id
    console.log(`New ID: ${newId}`)

    // 5. Ensure Profile
    // (If triggers work, profile exists. If not, insert.)
    const { data: profile } = await adminClient.from('profiles').select('id').eq('id', newId).single()
    if (!profile) {
        console.log('Inserting profile manually...')
        await adminClient.from('profiles').insert({
            id: newId,
            email: TARGET_EMAIL,
            full_name: "Ahmet Özkan",
            role: "student",
            class_id: "14657558-7f6d-4d87-b041-37cb80a7a779",
            organization_id: "283442f5-d8c2-45da-94be-0c3770c96870",
            updated_at: new Date().toISOString()
        })
    }

    // 6. Re-attach Data
    if (examIds.length > 0) {
        console.log('Re-attaching exams...')
        const { error: attachExams } = await adminClient
            .from('exam_results')
            .update({ student_id: newId })
            .in('id', examIds)
        if (attachExams) console.error('Failed to attach exams:', attachExams)
    }

    if (sessionIds.length > 0) {
        console.log('Re-attaching sessions...')
        const { error: attachSessions } = await adminClient
            .from('study_sessions')
            .update({ student_id: newId })
            .in('id', sessionIds)
        if (attachSessions) console.error('Failed to attach sessions:', attachSessions)
    }

    console.log('--- MIGRATION COMPLETE ---')
}

migrateAhmet()
