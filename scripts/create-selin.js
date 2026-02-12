const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORGANIZATION_ID = '283442f5-d8c2-45da-94be-0c3770c96870'
const BRANCH_ID = '81ff3d0d-488a-4b7e-b589-b22c19b7ee7c'
const ROLE_ID = '380914a0-783e-4300-8fb7-b55c81f575b7'
const CLASS_12C_ID = '14657558-7f6d-4d87-b041-37cb80a7a779'

async function createStudent() {
    const fullName = 'Selin Aslan'
    const email = 'selinaslan@cervus.com'

    console.log(`Creating ${fullName}...`)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: '123456',
        email_confirm: true,
        user_metadata: {
            full_name: fullName
        },
        app_metadata: {
            role: 'student',
            organization_id: ORGANIZATION_ID,
            branch_id: BRANCH_ID,
            class_id: CLASS_12C_ID
        }
    })

    if (authError) {
        console.log(`❌ Auth error: ${authError.message}`)
        return
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role_id: ROLE_ID,
            organization_id: ORGANIZATION_ID,
            branch_id: BRANCH_ID,
            class_id: CLASS_12C_ID
        })

    if (profileError) {
        console.log(`❌ Profile error: ${profileError.message}`)
    } else {
        console.log(`✅ Created ${fullName} successfully!`)
    }
}

createStudent()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
