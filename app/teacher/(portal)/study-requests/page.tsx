import StudyRequestsList from '@/components/dashboard/teacher/study-requests-list';
import { getAuthContext } from '@/lib/auth-context';

// Etüt taleplerini çekmek için yardımcı fonksiyon
async function getData() {
    const { supabase, user } = await getAuthContext();
    if (!user) return { pending: [], history: [] };

    // Öğretmen için tüm talepleri çek
    const { data, error } = await supabase
        .from('study_sessions')
        .select(`
            id,
            topic,
            scheduled_at,
            status:study_session_statuses(name),
            student:profiles!student_id(full_name, avatar_url, classes(name))
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return { pending: [], history: [] };
    }

    // Response'u tiplendir
    interface StudyRequestRaw {
        id: string;
        topic: string | null;
        scheduled_at: string;
        status: { name: string } | null;
        student: {
            full_name: string | null;
            avatar_url: string | null;
            classes: { name: string } | null;
        } | null;
    }

    const rawData = data as unknown as StudyRequestRaw[];

    const requests = rawData.map((r) => ({
        ...r,
        topic: r.topic || '',
        status: (r.status?.name || 'unknown') as "pending" | "approved" | "rejected" | "completed",
        student: r.student ? {
            full_name: r.student.full_name || 'İsimsiz',
            avatar_url: r.student.avatar_url,
            classes: r.student.classes
        } : { full_name: 'Öğrenci Bilgisi Yok', avatar_url: null, classes: null }
    }));

    const pending = requests.filter((r) => r.status === 'pending');
    const history = requests.filter((r) => r.status !== 'pending');

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

            <StudyRequestsList pendingRequests={pending} pastRequests={history} />
        </div>
    );
}
