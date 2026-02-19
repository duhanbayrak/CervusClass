import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    FileText,
    Calendar,
    ArrowLeft,
    BarChart3,
    TrendingUp,
    Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from 'next/link'
import { getExamDetailData } from '@/lib/actions/exam-stats'
import { flattenExamDetails } from '@/lib/utils'
import { ExamDetailCharts } from '@/components/student/exams/exam-detail-charts'

async function getExamDetails(examId: string, userId: string) {
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

    const { data: exam, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('id', examId)
        .eq('student_id', userId)
        .single()

    if (error || !exam) {
        return null
    }

    return exam
}

export default async function ExamDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

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
    if (!user) {
        redirect('/login')
    }

    const exam = await getExamDetails(id, user.id)
    if (!exam) {
        notFound()
    }

    // Detay verileri (sınıf/okul ortalamaları)
    const detailData = await getExamDetailData(id)

    // Parse scores using helper to handle nested structures (AYT)
    const scoresData = flattenExamDetails(exam.scores, exam.exam_type)

    // Calculate scores with bos (empty) for each subject
    const questionCounts: Record<string, number> = {
        'Turkce': 40,
        'Matematik': 40,
        'Fen': 20,
        'Sosyal': 20,
        'Turkish': 40,
        'Math': 40,
        'Science': 20,
        'Social': 20
    }

    const scores = Object.entries(scoresData).map(([subject, data]: [string, any]) => {
        // If data is just a number (old format), return minimal info
        if (typeof data === 'number') {
            return { subject, dogru: '-', yanlis: '-', bos: '-', net: data }
        }

        // New format with dogru, yanlis, net
        const dogru = data.dogru ?? 0
        const yanlis = data.yanlis ?? 0
        const net = data.net ?? 0
        const totalQuestions = questionCounts[subject] ?? 40
        const bos = totalQuestions - dogru - yanlis

        return {
            subject,
            dogru,
            yanlis,
            bos: bos >= 0 ? bos : 0,
            net
        }
    })

    return (
        <div className="container py-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Link href="/student/exams">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri
                    </Button>
                </Link>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Sınav Detayı</span>
                </div>
            </div>

            {/* Exam Header */}
            <div className="border-b pb-6 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">{exam.exam_name}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">
                                    {exam.exam_date
                                        ? format(new Date(exam.exam_date), 'd MMMM yyyy EEEE', { locale: tr })
                                        : 'Tarih Belirtilmemiş'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Badge
                        variant="secondary"
                        className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                    >
                        Açıklandı
                    </Badge>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Toplam Net</p>
                        <Award className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-primary">{exam.total_net ?? '-'}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Durum</p>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">Başarılı</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Ders Sayısı</p>
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold">{scores.length}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Ortalama Net</p>
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold">
                        {scores.length > 0
                            ? ((exam.total_net ?? 0) / scores.length).toFixed(2)
                            : '-'}
                    </p>
                </div>
            </div>

            {/* Detailed Scores Table */}
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="p-6 border-b bg-muted/50">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Ders Bazında Sonuçlar
                    </h2>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-[40%] font-semibold">Ders Adı</TableHead>
                            <TableHead className="text-center font-semibold">Doğru</TableHead>
                            <TableHead className="text-center font-semibold">Yanlış</TableHead>
                            <TableHead className="text-center font-semibold">Boş</TableHead>
                            <TableHead className="text-center font-bold text-primary bg-primary/5">Net</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scores.length > 0 ? (
                            scores.map((scoreData) => (
                                <TableRow key={scoreData.subject} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-primary/50" />
                                            <span className="text-base">{scoreData.subject}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-semibold text-green-600 text-base">
                                            {scoreData.dogru}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-semibold text-red-500 text-base">
                                            {scoreData.yanlis}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-medium text-muted-foreground text-base">
                                            {scoreData.bos}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center bg-primary/5">
                                        <span className="font-bold text-primary text-lg">
                                            {scoreData.net}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Detaylı skor bilgisi bulunamadı
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Grafik Karşılaştırmaları */}
            {detailData && (
                <ExamDetailCharts
                    scores={exam.scores}
                    examType={exam.exam_type}
                    totalNet={exam.total_net}
                    classSubjectAverages={detailData.classSubjectAverages}
                    classTotalAvg={detailData.classTotalAvg}
                    schoolSubjectAverages={detailData.schoolSubjectAverages}
                    schoolTotalAvg={detailData.schoolTotalAvg}
                />
            )}
        </div>
    )
}
