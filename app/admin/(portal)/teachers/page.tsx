import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import TeacherList from '@/components/dashboard/admin/teacher-list'

export default async function TeachersPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    )

    // 1. Get Teacher Role ID first for reliable filtering
    const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'teacher')
        .single();

    const teacherRoleId = roleData?.id;

    // 2. Fetch profiles with that role_id
    let teachers: any[] = [];

    if (teacherRoleId) {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                email,
                avatar_url,
                created_at,
                branches (name)
            `)
            .eq('role_id', teacherRoleId)
            .order('created_at', { ascending: false });

        if (data) {
            teachers = data;
            if (data.length > 0) {
                console.log('Teachers Fetch Sample:', JSON.stringify(data[0], null, 2));
            }
        }
        if (error) {
            console.error('Error fetching teachers (Detailed):', JSON.stringify(error, null, 2));
            // Try fetching without filter to see if it works
            // ...
        }
    }

    // 3. Fetch branches for the dropdown
    const { data: branchesData } = await supabase
        .from('branches')
        .select('name')
        .order('name', { ascending: true });

    const branches = branchesData?.map(b => b.name) || [];

    // Handle potential errors or empty states (ignore error for now, return empty)
    const formattedTeachers = teachers?.map(t => ({
        id: t.id,
        full_name: t.full_name,
        email: t.email,
        avatar_url: t.avatar_url,
        created_at: t.created_at || new Date().toISOString(),
        branch: t.branches?.name || null
    })) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Öğretmen Yönetimi</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Sistemdeki öğretmenleri buradan yönetebilir, yeni kayıt oluşturabilirsiniz.
                </p>
            </div>

            <TeacherList initialTeachers={formattedTeachers} initialBranches={branches} />
        </div>
    )
}
