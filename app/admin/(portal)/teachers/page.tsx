import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import TeacherList from '@/components/dashboard/admin/teacher-list';
import { getAuthContext } from '@/lib/auth-context';

export default async function TeachersPage() {
    // Merkezi auth context — tek supabase client
    const { supabase } = await getAuthContext();

    try {
        // 1. Öğretmen rolü ID'sini al
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'teacher')
            .single();

        if (roleError) {
            console.error('Role Fetch Error:', roleError);
        }

        const teacherRoleId = roleData?.id;

        // 2. Öğretmen profillerini çek
        interface TeacherProfile {
            id: string;
            full_name: string | null;
            email: string | null;
            phone: string | null;
            title: string | null;
            bio: string | null;
            avatar_url: string | null;
            created_at: string;
            branches: { name: string } | null;
            role_id: string;
        }

        let teachers: TeacherProfile[] = [];

        if (teacherRoleId) {
            const { data, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    email,
                    phone,
                    title,
                    bio,
                    avatar_url,
                    created_at,
                    branches (name)
                `)
                .eq('role_id', teacherRoleId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (profileError) {
                console.error('Profile Fetch Error:', profileError);
            }

            if (data) {
                teachers = data as unknown as TeacherProfile[];
            }
        }

        // 3. Şubeleri çek
        const { data: branchesData, error: branchError } = await supabase
            .from('branches')
            .select('name')
            .order('name', { ascending: true });

        if (branchError) {
            console.error('Branch Fetch Error:', branchError);
        }

        const branches = branchesData?.map(b => b.name) || [];


        // Öğretmen verilerini formatlayarak gönder
        const formattedTeachers = teachers?.map(t => ({
            id: t.id,
            full_name: t.full_name,
            email: t.email,
            phone: t.phone,
            title: t.title,
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

                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>}>
                    <TeacherList initialTeachers={formattedTeachers} initialBranches={branches} />
                </Suspense>
            </div>
        )
    } catch (err) {
        console.error('Teachers Page Error:', err);
        return (
            <div className="p-8 text-center text-red-500">
                Bir hata oluştu. Lütfen konsolu kontrol edin.
            </div>
        );
    }
}
