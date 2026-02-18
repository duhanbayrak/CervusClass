
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ExamHistory } from '@/components/student/exams/exam-history'

import { DynamicExamOverviewChart, DynamicSubjectOverviewCharts } from '@/components/student/exams/student-charts-wrapper'

import { getExamOverviewData } from '@/lib/actions/exam-stats'

export default async function StudentExamsPage() {
    const overviewData = await getExamOverviewData()

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

    let exams: any[] = []
    if (user) {
        const { data } = await supabase
            .from('exam_results')
            .select('*')
            .eq('student_id', user.id)
            .order('exam_date', { ascending: false })
        exams = data || []
    }

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2 border-b pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Sınav Geçmişi</h1>
                <p className="text-muted-foreground">
                    Katıldığınız tüm deneme sınavlarının sonuçlarını ve detaylı analizlerini buradan inceleyebilirsiniz.
                </p>
            </div>

            {/* Toplam Net Gelişim Grafiği */}
            {overviewData && overviewData.studentExams && overviewData.studentExams.length > 0 && (
                <DynamicExamOverviewChart
                    studentExams={overviewData.studentExams}
                    classAverages={overviewData.classAverages}
                    schoolAverages={overviewData.schoolAverages}
                />
            )}

            {/* Ders Bazlı Net Gelişimi */}
            {overviewData && overviewData.studentExams && overviewData.studentExams.length > 0 && (
                <DynamicSubjectOverviewCharts
                    studentExams={overviewData.studentExams}
                    classSubjectOverview={overviewData.classSubjectOverview ?? []}
                    schoolSubjectOverview={overviewData.schoolSubjectOverview ?? []}
                />
            )}

            {/* Sınav Listesi */}
            <ExamHistory exams={exams} />
        </div>
    )
}
