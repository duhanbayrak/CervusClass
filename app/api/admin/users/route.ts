import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserRole } from '@/lib/auth-helpers'
import { Profile } from '@/types/database'

async function verifyAdminRequest() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // NOSONAR
        { cookies: { getAll() { return cookieStore.getAll() } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

    const { data: requesterProfile } = await supabase.from('profiles').select('roles(name), organization_id').eq('id', user.id).single()
    const roleName = getUserRole(requesterProfile as unknown as Profile)
    if (roleName !== 'admin' && roleName !== 'super_admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

    return { user, requesterProfile }
}

async function resolveOrCreateBranch(branchName: string): Promise<string | null> {
    const { data: existing } = await supabaseAdmin.from('branches').select('id').eq('name', branchName).single()
    if (existing) return existing.id
    const { data: newBranch } = await supabaseAdmin.from('branches').insert({ name: branchName }).select('id').single()
    return newBranch?.id || null
}

export async function POST(request: Request) {
    const auth = await verifyAdminRequest()
    if ('error' in auth) return auth.error
    const { requesterProfile } = auth

    // 2. Parse Body
    const body = await request.json()
    const { email, password, fullName, role = 'teacher', branch, phone, title, bio } = body

    if (!email || !password || !fullName) {
        return NextResponse.json({ error: 'Eksik alanlar var' }, { status: 400 })
    }

    // 3. Create User in Auth
    // Use service role key
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName
        }
    })

    if (createError) {
        console.error("Create User Error:", createError);
        return NextResponse.json({ error: 'Kullanıcı oluşturulurken bir hata oluştu.' }, { status: 500 })
    }

    if (!newUser.user) {
        return NextResponse.json({ error: 'Kullanıcı oluşturulamadı.' }, { status: 500 })
    }

    // Prepare profile data
    // Fetch Role ID first
    const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', role)
        .single()

    if (!roleData) {
        return NextResponse.json({ error: 'Rol bulunamadı.' }, { status: 400 })
    }

    const profileData: Partial<Profile> = {
        id: newUser.user.id,
        email: email, // Ensure email is in profile
        full_name: fullName,
        role_id: roleData.id,
        organization_id: requesterProfile?.organization_id, // Inherit organization from admin
        phone: phone || null,
        title: title || null,
        bio: bio || null,
        start_date: new Date().toISOString() // Set default start date to now
    };

    if (branch && role === 'teacher') {
        const branchId = await resolveOrCreateBranch(branch)
        if (branchId) profileData.branch_id = branchId
    }

    // 4. Upsert Profile
    // Use upsert to handle cases where trigger might or might not have run
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData as any) // Type assertion needed because supabase-js types might differ slightly or require full object

    if (updateError) {
        console.error("Profile Update Error:", updateError);
        return NextResponse.json({ error: 'Profil oluşturulamadı.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: newUser.user })
}

export async function DELETE(request: Request) {
    const auth = await verifyAdminRequest()
    if ('error' in auth) return auth.error

    // 2. Get User ID from URL
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // 3. Soft Delete User
    const { error: deleteError } = await supabaseAdmin
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId)

    if (deleteError) {
        console.error("Delete User Error:", deleteError);
        return NextResponse.json({ error: 'Kullanıcı silinemedi.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

type UserUpdateBody = {
    id: string
    email?: string
    password?: string
    fullName?: string
    branch?: string
    phone?: string
    title?: string
    bio?: string
}

async function updateAuthUser(id: string, email?: string, password?: string, fullName?: string): Promise<string | null> {
    const authUpdates: { email?: string; password?: string; user_metadata?: { full_name: string } } = {}
    if (email) authUpdates.email = email
    if (password && password.length > 0) authUpdates.password = password
    if (fullName) authUpdates.user_metadata = { full_name: fullName }
    if (Object.keys(authUpdates).length === 0) return null
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates)
    if (authError) { console.error("Auth Update Error:", authError); return 'Kullanıcı bilgileri güncellenemedi.' }
    return null
}

async function updateUserProfile(id: string, body: UserUpdateBody): Promise<string | null> {
    const profileUpdates: Partial<Profile> = {}
    if (body.fullName) profileUpdates.full_name = body.fullName
    if (body.email) profileUpdates.email = body.email
    if (body.phone !== undefined) profileUpdates.phone = body.phone
    if (body.title !== undefined) profileUpdates.title = body.title
    if (body.bio !== undefined) profileUpdates.bio = body.bio
    if (body.branch) {
        const branchId = await resolveOrCreateBranch(body.branch)
        if (branchId) profileUpdates.branch_id = branchId
    }
    const { error: profileError } = await supabaseAdmin.from('profiles').update(profileUpdates as Record<string, unknown>).eq('id', id)
    if (profileError) { console.error("Profile Update Error:", profileError); return 'Profil güncellenemedi.' }
    return null
}

export async function PUT(request: Request) {
    const auth = await verifyAdminRequest()
    if ('error' in auth) return auth.error

    const body: UserUpdateBody = await request.json()
    if (!body.id) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

    const authError = await updateAuthUser(body.id, body.email, body.password, body.fullName)
    if (authError) return NextResponse.json({ error: authError }, { status: 500 })

    const profileError = await updateUserProfile(body.id, body)
    if (profileError) return NextResponse.json({ error: profileError }, { status: 500 })

    return NextResponse.json({ success: true })
}
