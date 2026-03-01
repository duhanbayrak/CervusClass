import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import UpdateAssignmentForm from '@/components/dashboard/teacher/update-assignment-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PageProps {
    params: {
        id: string;
    }
}

async function getData(id: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL as string), // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // NOSONAR
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { classes: [], user: null, assignment: null };

    // Get the assignment
    const { data: assignment } = await supabase
        .from('homework')
        .select('*')
        .eq('id', id)
        .eq('teacher_id', user.id)
        .single();

    if (!assignment) return { classes: [], user: null, assignment: null };

    // Get classes (for edit form)
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

    // Pre-fetch students for the assignment's class to improve performance
    const { data: initialStudents } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('class_id', assignment.class_id)
        .eq('role_id', '380914a0-783e-4300-8fb7-b55c81f575b7') // Student role
        .order('full_name');

    return {
        classes: classes || [],
        user,
        assignment,
        initialStudents: initialStudents || []
    };
}

export default async function EditAssignmentPage({ params }: any) {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    const { classes, user, assignment, initialStudents } = await getData(id);

    if (!user) redirect('/login');
    if (!assignment) return <div>Ödev bulunamadı veya erişim yetkiniz yok.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/teacher/homework">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ödev Düzenle</h2>
                        <p className="text-slate-500 dark:text-slate-400">Mevcut ödev bilgilerini güncelleyin.</p>
                    </div>
                </div>

                <Link href={`/teacher/homework/${id}/check`}>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Ödevleri Kontrol Et
                    </Button>
                </Link>
            </div>

            <div className="max-w-2xl">
                <h3 className="text-lg font-medium mb-4">Ödev Bilgileri</h3>
                <UpdateAssignmentForm
                    assignment={assignment}
                    classes={classes}
                    userId={user.id}
                    initialStudents={initialStudents}
                />
            </div>
        </div>
    );
}
