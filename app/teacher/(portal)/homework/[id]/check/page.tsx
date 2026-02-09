import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import HomeworkDetailView from '@/components/student/homework-detail-view';

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
    if (!user) return { user: null, assignment: null, submissions: [] };

    // Get the assignment
    const { data: assignment } = await supabase
        .from('homework')
        .select(`
            *,
            classes(name)
        `)
        .eq('id', id)
        .eq('teacher_id', user.id)
        .single();

    if (!assignment) return { user: null, assignment: null, submissions: [] };

    // Get Submissions
    const { data: submissions } = await supabase
        .from('homework_submissions')
        .select(`
            id,
            status,
            submitted_at,
            student:student_id (
                id,
                full_name,
                avatar_url,
                student_number
            )
        `)
        .eq('homework_id', id)
        .order('student(full_name)', { ascending: true });

    return {
        user,
        assignment,
        submissions: submissions || []
    };
}

export default async function CheckAssignmentPage({ params }: { params: any }) {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const { user, assignment, submissions } = await getData(id);

    if (!user) redirect('/login');
    if (!assignment) return <div>Ödev bulunamadı veya erişim yetkiniz yok.</div>;

    // Transform data for view
    const viewData = {
        homework: {
            id: assignment.id,
            description: assignment.description,
            due_date: assignment.due_date,
            class_name: assignment.classes?.name || 'Sınıf',
            course_name: '---' // Course relation might need to be added to query if available
        },
        submissions: submissions as any[]
    };

    return (
        <HomeworkDetailView
            homework={viewData.homework}
            submissions={viewData.submissions}
        />
    );
}
