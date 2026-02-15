
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ExamHistory } from '@/components/student/exams/exam-history'

async function getExams() {
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: exams, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', user.id)
        .order('exam_date', { ascending: false })

    if (error) {
        console.error('Error fetching exams:', error)
        return []
    }

    return exams
}

export default async function StudentExamsPage() {
    const exams = await getExams()

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2 border-b pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Sınav Geçmişi</h1>
                <p className="text-muted-foreground">
                    Katıldığınız tüm deneme sınavlarının sonuçlarını ve detaylı analizlerini buradan inceleyebilirsiniz.
                </p>
            </div>

            <ExamHistory exams={exams} />
        </div>
    )
}
