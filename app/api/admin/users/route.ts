import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserRole } from '@/lib/auth-helpers'
import { Profile } from '@/types/database'

export async function POST(request: Request) {
    // 1. Verify Request: Check if caller is Admin
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or super_admin AND Get Organization ID
    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('roles(name), organization_id')
        .eq('id', user.id)
        .single();

    const roleName = getUserRole(requesterProfile as unknown as Profile);

    if (roleName !== 'admin' && roleName !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    // Handle Branch for teachers (convert name to ID)
    if (branch && role === 'teacher') {
        const { data: existingBranch } = await supabaseAdmin
            .from('branches')
            .select('id')
            .eq('name', branch)
            .single();

        if (existingBranch) {
            profileData.branch_id = existingBranch.id;
        } else {
            // Create new branch automatically if not exists
            const { data: newBranch, error: branchError } = await supabaseAdmin
                .from('branches')
                .insert({ name: branch })
                .select('id')
                .single();

            if (!branchError && newBranch) {
                profileData.branch_id = newBranch.id;
            } else {
                console.error("Failed to create branch:", branchError);
            }
        }
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
    // 1. Verify Admin (Copy logic)
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('roles(name)')
        .eq('id', user.id)
        .single();

    const roleName = getUserRole(requesterProfile as unknown as Profile);

    if (roleName !== 'admin' && roleName !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

export async function PUT(request: Request) {
    // 1. Verify Admin (Copy logic)
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('roles(name)')
        .eq('id', user.id)
        .single();

    const roleName = getUserRole(requesterProfile as unknown as Profile);

    if (roleName !== 'admin' && roleName !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse Body
    const body = await request.json()
    const { id, email, password, fullName, branch, phone, title, bio } = body

    if (!id) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // 3. Update Auth User (if email/password changed)
    const authUpdates: { email?: string, password?: string, user_metadata?: { full_name: string } } = {}
    if (email) authUpdates.email = email
    if (password && password.length > 0) authUpdates.password = password
    if (fullName) authUpdates.user_metadata = { full_name: fullName }

    if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates)
        if (authError) {
            console.error("Auth Update Error:", authError);
            return NextResponse.json({ error: 'Kullanıcı bilgileri güncellenemedi.' }, { status: 500 })
        }
    }

    // 4. Update Profile
    const profileUpdates: Partial<Profile> = {}
    if (fullName) profileUpdates.full_name = fullName
    if (email) profileUpdates.email = email // Keep profile email in sync
    if (phone !== undefined) profileUpdates.phone = phone
    if (title !== undefined) profileUpdates.title = title
    if (bio !== undefined) profileUpdates.bio = bio

    // Handle Branch
    if (branch) {
        const { data: existingBranch } = await supabaseAdmin
            .from('branches')
            .select('id')
            .eq('name', branch)
            .single();

        if (existingBranch) {
            profileUpdates.branch_id = existingBranch.id;
        } else {
            // Create new branch
            const { data: newBranch, error: branchError } = await supabaseAdmin
                .from('branches')
                .insert({ name: branch })
                .select('id')
                .single();

            if (!branchError && newBranch) {
                profileUpdates.branch_id = newBranch.id;
            }
        }
    }

    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates as any)
        .eq('id', id)

    if (profileError) {
        console.error("Profile Update Error:", profileError);
        return NextResponse.json({ error: 'Profil güncellenemedi.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
