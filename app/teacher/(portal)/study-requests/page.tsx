import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import StudyRequestsList from '@/components/dashboard/teacher/study-requests-list';

async function getData() {
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
    if (!user) return { pending: [], history: [] };

    // Fetch all requests for this teacher
    const { data, error } = await supabase
        .from('study_sessions')
        .select(`
            id,
            topic,
            scheduled_at,
            status,
            student:profiles!student_id(full_name, avatar_url)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

    const requests = data || [];

    if (error) {
        console.error("TeacherStudyRequestsPage: Supabase Error:", error);
    }

    const pending = requests.filter(r => r.status === 'pending');
    const history = requests.filter(r => r.status !== 'pending');

    return { pending, history };
}

export default async function TeacherStudyRequestsPage() {
    const { pending, history } = await getData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Etüt Talepleri</h2>
                <p className="text-slate-500 dark:text-slate-400">Öğrencilerden gelen birebir çalışma taleplerini yönetin.</p>
            </div>

            <StudyRequestsList pendingRequests={pending as any} pastRequests={history as any} />
        </div>
    );
}
