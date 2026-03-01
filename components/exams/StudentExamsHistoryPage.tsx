import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ExamHistory } from '@/components/student/exams/exam-history'
import { DynamicExamOverviewChart, DynamicSubjectOverviewCharts } from '@/components/student/exams/student-charts-wrapper'
import { getExamOverviewData } from '@/lib/actions/exam-stats'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export type StudentExamsHistoryRole = 'admin' | 'teacher'

interface StudentExamsHistoryPageProps {
    readonly studentId: string
    readonly role: StudentExamsHistoryRole
}

export async function StudentExamsHistoryPage({ studentId, role }: StudentExamsHistoryPageProps) {
    const overviewData = await getExamOverviewData(studentId)

    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, classes(name)')
        .eq('id', studentId)
        .single()

    if (!profile) notFound()

    const { data: examsData } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', studentId)
        .order('exam_date', { ascending: false })

    const exams = examsData || []

    const backHref = role === 'admin' ? `/admin/students/${studentId}` : `/teacher/students/${studentId}`
    const breadcrumb = role === 'admin' ? 'Öğrenci Gelişim Analizi (Admin)' : 'Öğrenci Gelişim Analizi'
    type ProfileWithClass = { classes?: { name?: string }; full_name?: string }
    const className = (profile as unknown as ProfileWithClass).classes?.name

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href={backHref}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri
                    </Button>
                </Link>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{breadcrumb}</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 border-b pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{profile.full_name} - Sınav Gelişimi</h1>
                <p className="text-muted-foreground">
                    {className} sınıfı öğrencisinin tüm sınav geçmişi ve gelişim grafikleri.
                </p>
            </div>

            {overviewData?.studentExams && overviewData.studentExams.length > 0 && (
                <DynamicExamOverviewChart
                    studentExams={overviewData.studentExams}
                    classAverages={overviewData.classAverages}
                    schoolAverages={overviewData.schoolAverages}
                />
            )}

            {overviewData?.studentExams && overviewData.studentExams.length > 0 && (
                <DynamicSubjectOverviewCharts
                    studentExams={overviewData.studentExams}
                    classSubjectOverview={overviewData.classSubjectOverview ?? []}
                    schoolSubjectOverview={overviewData.schoolSubjectOverview ?? []}
                />
            )}

            <ExamHistory exams={exams} role={role} studentId={studentId} />
        </div>
    )
}
