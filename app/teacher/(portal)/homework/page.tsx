import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import HomeworkListTable from '@/components/dashboard/teacher/homework-list-table';

async function getAssignments() {
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
    if (!user) return [];

    const { data: homework } = await supabase
        .from('homework')
        .select(`
            *,
            classes(name)
        `)
        .eq('teacher_id', user.id)
        .order('due_date', { ascending: false });

    return homework || [];
}

export default async function TeacherHomeworkPage() {
    const assignments = await getAssignments();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ödev Yönetimi</h2>
                    <p className="text-slate-500 dark:text-slate-400">Verilen ödevler ve durumları</p>
                </div>
                <Link href="/teacher/homework/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Ödev Ekle
                    </Button>
                </Link>
            </div>

            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle>Ödev Listesi</CardTitle>
                </CardHeader>
                <CardContent>
                    <HomeworkListTable assignments={assignments as any[]} />
                </CardContent>
            </Card>
        </div>
    );
}
