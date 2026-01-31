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
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        .eq('teacher_id', user.id) // Ensure ownership
        .single();

    if (!assignment) return { classes: [], user, assignment: null };

    // Get classes
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

    return {
        classes: classes || [],
        user,
        assignment
    };
}

export default async function EditAssignmentPage({ params }: any) {
    // Next.js 15+ params handling needs await or similar, but in 16 it's async component so args are promises
    // Actually in usual app router 'params' is a prop. In latest Next.js params is a Promise.

    // Safety check for params await if using latest canary versions, but standard is prop.
    // Let's assume standard behavior or wait for id. 
    // To be safe in newer NextJS:
    // const { id } = await params;

    // However, if we don't know exact version behavior, let's treat it as possibly promise.
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    const { classes, user, assignment } = await getData(id);

    if (!user) redirect('/login');
    if (!assignment) return <div>Ödev bulunamadı veya erişim yetkiniz yok.</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/teacher/homework">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ödevi Düzenle</h2>
                    <p className="text-slate-500 dark:text-slate-400">Ödev detaylarını güncelleyin.</p>
                </div>
            </div>

            <UpdateAssignmentForm assignment={assignment} classes={classes} userId={user.id} />
        </div>
    );
}
