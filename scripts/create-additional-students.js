const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORGANIZATION_ID = '283442f5-d8c2-45da-94be-0c3770c96870'
const BRANCH_ID = '81ff3d0d-488a-4b7e-b589-b22c19b7ee7c'
const ROLE_ID = '380914a0-783e-4300-8fb7-b55c81f575b7' // student role

// Class IDs
const CLASS_IDS = {
    '12-C': '14657558-7f6d-4d87-b041-37cb80a7a779',
    '12-E': 'b93ea09e-3a14-498c-adde-4151fb41f05e',
    'Mezun': 'fe120fcb-813a-4298-9982-82d0952c7bbc'
}

// Turkish names (30 unique ones)
const students = [
    // 12-C students (10)
    { firstName: 'Deniz', lastName: 'Yildirim', className: '12-C' },
    { firstName: 'Ege', lastName: 'Koc', className: '12-C' },
    { firstName: 'Elif', lastName: 'Sahin', className: '12-C' },
    { firstName: 'Emre', lastName: 'Aksoy', className: '12-C' },
    { firstName: 'Esra', lastName: 'Polat', className: '12-C' },
    { firstName: 'Fatma', lastName: 'Gunes', className: '12-C' },
    { firstName: 'Furkan', lastName: 'Erdogan', className: '12-C' },
    { firstName: 'Gamze', lastName: 'Ozkan', className: '12-C' },
    { firstName: 'Gizem', lastName: 'Kurt', className: '12-C' },
    { firstName: 'Gokhan', lastName: 'Tas', className: '12-C' },

    // 12-E students (10)
    { firstName: 'Hakan', lastName: 'Kara', className: '12-E' },
    { firstName: 'Halil', lastName: 'Celik', className: '12-E' },
    { firstName: 'Hatice', lastName: 'Yavuz', className: '12-E' },
    { firstName: 'Helin', lastName: 'Ozturk', className: '12-E' },
    { firstName: 'Huseyin', lastName: 'Aydin', className: '12-E' },
    { firstName: 'Irem', lastName: 'Yildiz', className: '12-E' },
    { firstName: 'Ismail', lastName: 'Ozdemir', className: '12-E' },
    { firstName: 'Kadir', lastName: 'Dogan', className: '12-E' },
    { firstName: 'Kemal', lastName: 'Arslan', className: '12-E' },
    { firstName: 'Kerem', lastName: 'Kaya', className: '12-E' },

    // Mezun students (10)
    { firstName: 'Leyla', lastName: 'Yilmaz', className: 'Mezun' },
    { firstName: 'Mahmut', lastName: 'Demir', className: 'Mezun' },
    { firstName: 'Mehmet', lastName: 'Cetin', className: 'Mezun' },
    { firstName: 'Melisa', lastName: 'Ozcan', className: 'Mezun' },
    { firstName: 'Mert', lastName: 'Acar', className: 'Mezun' },
    { firstName: 'Mustafa', lastName: 'Coskun', className: 'Mezun' },
    { firstName: 'Naz', lastName: 'Korkmaz', className: 'Mezun' },
    { firstName: 'Necati', lastName: 'Bayrak', className: 'Mezun' },
    { firstName: 'Nihal', lastName: 'Yalcin', className: 'Mezun' },
    { firstName: 'Onur', lastName: 'Sen', className: 'Mezun' }
]

// Turkish to English character mapping
const turkishToEnglish = (str) => {
    const mapping = {
        'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U',
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
    }
    return str.split('').map(char => mapping[char] || char).join('')
}

async function createStudents() {
    console.log('Creating 30 additional students...\n')

    let successCount = 0
    let failCount = 0

    for (const student of students) {
        const fullName = `${student.firstName} ${student.lastName}`
        const email = `${turkishToEnglish(student.firstName).toLowerCase()}${turkishToEnglish(student.lastName).toLowerCase()}@cervus.com`
        const classId = CLASS_IDS[student.className]

        try {
            // Create auth user
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
                    class_id: classId
                }
            })

            if (authError) {
                console.log(`❌ Failed to create ${fullName}: ${authError.message}`)
                failCount++
                continue
            }

            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    role_id: ROLE_ID,
                    organization_id: ORGANIZATION_ID,
                    branch_id: BRANCH_ID,
                    class_id: classId
                })

            if (profileError) {
                console.log(`❌ Failed to create profile for ${fullName}: ${profileError.message}`)
                failCount++
                continue
            }

            console.log(`✅ Created: ${fullName} (${email}) - Class: ${student.className}`)
            successCount++

        } catch (error) {
            console.log(`❌ Error creating ${fullName}: ${error.message}`)
            failCount++
        }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Successfully created: ${successCount}`)
    console.log(`   ❌ Failed: ${failCount}`)
    console.log(`   📝 Total: ${students.length}`)
}

createStudents()
    .then(() => {
        console.log('\n✨ Done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
    })
