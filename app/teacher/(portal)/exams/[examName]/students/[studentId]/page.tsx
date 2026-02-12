import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    ArrowLeft,
    User,
    Award,
    TrendingUp,
    BarChart3,
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

async function getStudentExamDetails(examName: string, studentId: string) {
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

    // Get student's exam result
    const { data: result, error } = await supabase
        .from('exam_results')
        .select(`
            id,
            exam_name,
            exam_date,
            total_net,
            scores,
            profiles!inner (
                id,
                full_name,
                student_number,
                class_id,
                classes!inner (
                    id,
                    name
                )
            )
        `)
        .eq('exam_name', examName)
        .eq('student_id', studentId)
        .single()

    if (error || !result) {
        return null
    }

    // Get class average and ranking
    const classId = result.profiles?.classes?.id
    const { data: classResults } = await supabase
        .from('exam_results')
        .select('total_net, student_id')
        .eq('exam_name', examName)
        .eq('profiles.class_id', classId)
        .order('total_net', { ascending: false })

    let classRank = 1
    let classAvg = 0
    if (classResults) {
        classAvg = classResults.reduce((sum: number, r: any) => sum + (r.total_net || 0), 0) / classResults.length
        classRank = classResults.findIndex((r: any) => r.student_id === studentId) + 1
    }

    // Parse scores
    let scoresData = result.scores
    if (typeof scoresData === 'string') {
        try {
            scoresData = JSON.parse(scoresData)
        } catch (e) {
            scoresData = {}
        }
    }

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

    const scores = scoresData && typeof scoresData === 'object'
        ? Object.entries(scoresData).map(([subject, data]: [string, any]) => {
            if (typeof data === 'number') {
                return { subject, dogru: '-', yanlis: '-', bos: '-', net: data }
            }

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
        : []

    return {
        student: {
            fullName: result.profiles?.full_name || 'N/A',
            studentNumber: result.profiles?.student_number || 'N/A',
            className: result.profiles?.classes?.name || 'N/A',
            classId: result.profiles?.classes?.id
        },
        exam: {
            name: result.exam_name,
            date: result.exam_date
        },
        scores,
        totalNet: result.total_net || 0,
        classRank,
        classAvg
    }
}

export default async function StudentExamDetailPage({
    params,
}: {
    params: Promise<{ examName: string; studentId: string }>
}) {
    const { examName, studentId } = await params

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

    const data = await getStudentExamDetails(decodeURIComponent(examName), studentId)
    if (!data) {
        notFound()
    }

    return (
        <div className="container py-8 max-w-6xl mx-auto space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Link href="/teacher/exams">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri
                    </Button>
                </Link>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Öğrenci Detayı</span>
                </div>
            </div>

            {/* Student Header */}
            <div className="border-b pb-6 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">{data.student.fullName}</h1>
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="text-base px-3 py-1">
                                {data.student.className}
                            </Badge>
                            <span className="text-muted-foreground text-sm">
                                No: {data.student.studentNumber}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="pt-2">
                    <h2 className="text-xl font-semibold text-muted-foreground">{data.exam.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        {data.exam.date
                            ? format(new Date(data.exam.date), 'd MMMM yyyy', { locale: tr })
                            : 'Tarih Belirtilmemiş'}
                    </p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Toplam Net</p>
                        <Award className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-primary">{data.totalNet.toFixed(2)}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Sınıf Sırası</p>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">#{data.classRank}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Sınıf Ortalaması</p>
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold">{data.classAvg.toFixed(2)}</p>
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
                        {data.scores.length > 0 ? (
                            data.scores.map((scoreData) => (
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

            {/* Placeholder for charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-xl border bg-muted/30 border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                        Ders bazında performans grafiği yakında eklenecek
                    </p>
                </div>
                <div className="p-6 rounded-xl border bg-muted/30 border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                        Sınıf karşılaştırma grafiği yakında eklenecek
                    </p>
                </div>
            </div>
        </div>
    )
}
