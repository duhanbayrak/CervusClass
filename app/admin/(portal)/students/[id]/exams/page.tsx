
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ExamHistory } from '@/components/student/exams/exam-history'
import { DynamicExamOverviewChart, DynamicSubjectOverviewCharts } from '@/components/student/exams/student-charts-wrapper'
import { getExamOverviewData } from '@/lib/actions/exam-stats'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminStudentExamsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const overviewData = await getExamOverviewData(id)

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

    // Get student profile for header
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            full_name,
            classes (
                name
            )
        `)
        .eq('id', id)
        .single()

    if (!profile) {
        notFound()
    }

    let exams: any[] = []
    const { data } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', id)
        .order('exam_date', { ascending: false })
    exams = data || []

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Link href={`/admin/students/${id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri
                    </Button>
                </Link>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Öğrenci Gelişim Analizi (Admin)</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 border-b pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{profile.full_name} - Sınav Gelişimi</h1>
                <p className="text-muted-foreground">
                    {(profile as any).classes?.name} sınıfı öğrencisinin tüm sınav geçmişi ve gelişim grafikleri.
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
            <ExamHistory exams={exams} role="admin" studentId={id} />
        </div>
    )
}
