import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import CreateAssignmentForm from '@/components/dashboard/teacher/create-assignment-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function getData() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
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
    if (!user) return { classes: [], user: null, organizationId: null };

    // Get user profile for organization_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    // Get all classes
    // In a real app, we might filter classes assigned to this teacher.
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

    return {
        classes: classes || [],
        user,
        organizationId: profile?.organization_id
    };
}

export default async function NewAssignmentPage() {
    const { classes, user, organizationId } = await getData();

    if (!user) {
        redirect('/login');
    }

    if (!organizationId) {
        return <div>Organization ID not found.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/teacher/homework">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Yeni Ödev Ekle</h2>
                    <p className="text-slate-500 dark:text-slate-400">Bir sınıfa yeni ödev atamak için formu doldurun.</p>
                </div>
            </div>

            <CreateAssignmentForm classes={classes} userId={user.id} organizationId={organizationId} />
        </div>
    );
}
