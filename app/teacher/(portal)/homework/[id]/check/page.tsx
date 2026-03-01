import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import HomeworkDetailView from '@/components/student/homework-detail-view';

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
    if (!user) return { user: null, assignment: null, submissions: [] };

    try {
        // Get the assignment
        const { data: assignment, error: assignmentError } = await supabase
            .from('homework')
            .select(`
                *,
                classes(name)
            `)
            .eq('id', id)
            .eq('teacher_id', user.id)
            .maybeSingle();

        if (assignmentError) {
            console.error('Error fetching assignment:', assignmentError);
            return { user, assignment: null, submissions: [] };
        }

        if (!assignment) return { user, assignment: null, submissions: [] };

        // Get Submissions
        const { data: submissions, error: submissionsError } = await supabase
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
            .eq('homework_id', id);

        if (submissionsError) {
            console.error('Error fetching submissions:', submissionsError);
            return { user, assignment, submissions: [] };
        }

        // Sort submissions client-side safely
        const sortedSubmissions = (submissions || []).sort((a: any, b: any) => {
            const nameA = a.student?.full_name || '';
            const nameB = b.student?.full_name || '';
            return nameA.localeCompare(nameB);
        });

        return {
            user,
            assignment,
            submissions: sortedSubmissions
        };

    } catch (error) {
        console.error('Unexpected error in check page:', error);
        return { user, assignment: null, submissions: [] };
    }
}

export default async function CheckAssignmentPage(props: Readonly<{ params: Promise<{ id: string }> }>) { // NOSONAR
    const params = await props.params;
    const id = params.id;
    const { user, assignment, submissions } = await getData(id);

    if (!user) redirect('/login');

    // Eğer ödev bulunamazsa dashboard'a atmak yerine hata mesajı gösterelim.
    if (!assignment) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-red-600">Ödev Bulunamadı</h2>
                <p className="text-slate-600 mt-2">Aradığınız ödev mevcut değil veya bu ödeve erişim yetkiniz yok.</p>
            </div>
        );
    }

    // Transform data for view
    const viewData = {
        homework: {
            id: assignment.id,
            description: assignment.description,
            due_date: assignment.due_date,
            class_name: assignment.classes?.name || 'Sınıf',
            course_name: 'Genel Ödev' // courses relation bulunmadığı için sabit değer
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
