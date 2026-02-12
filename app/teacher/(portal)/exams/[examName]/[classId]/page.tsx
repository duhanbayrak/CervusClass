import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    ArrowLeft,
    Users,
    TrendingUp,
    TrendingDown,
    Award,
    ChevronRight,
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

interface StudentExamData {
    studentId: string
    fullName: string
    studentNumber: string
    scores: any
    totalNet: number
    rank: number
}

async function getClassExamResults(examName: string, classId: string) {
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

    // Get exam results for this class
    const { data: results, error } = await supabase
        .from('exam_results')
        .select(`
            id,
            exam_name,
            exam_date,
            total_net,
            scores,
            student_id,
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
        .eq('profiles.class_id', classId)
        .order('total_net', { ascending: false })

    if (error || !results || results.length === 0) {
        return null
    }

    // Get class info
    const className = results[0].profiles?.classes?.name

    // Parse and rank students
    const students: StudentExamData[] = results.map((result: any, index: number) => {
        let scoresData = result.scores
        if (typeof scoresData === 'string') {
            try {
                scoresData = JSON.parse(scoresData)
            } catch (e) {
                scoresData = {}
            }
        }

        return {
            studentId: result.student_id,
            fullName: result.profiles?.full_name || 'N/A',
            studentNumber: result.profiles?.student_number || 'N/A',
            scores: scoresData,
            totalNet: result.total_net || 0,
            rank: index + 1
        }
    })

    return {
        examName,
        examDate: results[0].exam_date,
        className,
        classId,
        students
    }
}

export default async function ClassExamDetailPage({
    params,
}: {
    params: Promise<{ examName: string; classId: string }>
}) {
    const { examName, classId } = await params

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

    const classData = await getClassExamResults(decodeURIComponent(examName), classId)
    if (!classData) {
        notFound()
    }

    const { students, className } = classData
    const avgNet = students.reduce((sum, s) => sum + s.totalNet, 0) / students.length
    const highestNet = students.length > 0 ? students[0].totalNet : 0
    const lowestNet = students.length > 0 ? students[students.length - 1].totalNet : 0

    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-6">
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
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Sınıf Detayı</span>
                </div>
            </div>

            {/* Exam and Class Header */}
            <div className="border-b pb-6 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">{classData.examName}</h1>
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="text-base px-3 py-1">
                                {className}
                            </Badge>
                            <span className="text-muted-foreground text-sm">
                                {classData.examDate
                                    ? format(new Date(classData.examDate), 'd MMMM yyyy', { locale: tr })
                                    : 'Tarih Belirtilmemiş'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Ortalama Net</p>
                        <Award className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-primary">{avgNet.toFixed(2)}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">En Yüksek</p>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{highestNet.toFixed(2)}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">En Düşük</p>
                        <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">{lowestNet.toFixed(2)}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Katılım</p>
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold">{students.length}</p>
                </div>
            </div>

            {/* Students Table */}
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="p-6 border-b bg-muted/50">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Öğrenci Performansı
                    </h2>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-16 font-semibold text-center">#</TableHead>
                            <TableHead className="font-semibold">Öğrenci</TableHead>
                            <TableHead className="text-center font-semibold">No</TableHead>
                            <TableHead className="text-center font-semibold">Türkçe</TableHead>
                            <TableHead className="text-center font-semibold">Matematik</TableHead>
                            <TableHead className="text-center font-semibold">Fen</TableHead>
                            <TableHead className="text-center font-semibold">Sosyal</TableHead>
                            <TableHead className="text-center font-bold text-primary bg-primary/5">Toplam Net</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => {
                            const turkcenet = student.scores?.Turkce?.net || student.scores?.Turkish?.net || '-'
                            const matematikNet = student.scores?.Matematik?.net || student.scores?.Math?.net || '-'
                            const fenNet = student.scores?.Fen?.net || student.scores?.Science?.net || '-'
                            const sosyalNet = student.scores?.Sosyal?.net || student.scores?.Social?.net || '-'

                            return (
                                <TableRow key={student.studentId} className="hover:bg-muted/50">
                                    <TableCell className="text-center">
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${student.rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                student.rank === 2 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                                                    student.rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                        'bg-muted text-muted-foreground'
                                            }`}>
                                            {student.rank}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{student.fullName}</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{student.studentNumber}</TableCell>
                                    <TableCell className="text-center font-semibold">{turkcenet}</TableCell>
                                    <TableCell className="text-center font-semibold">{matematikNet}</TableCell>
                                    <TableCell className="text-center font-semibold">{fenNet}</TableCell>
                                    <TableCell className="text-center font-semibold">{sosyalNet}</TableCell>
                                    <TableCell className="text-center bg-primary/5">
                                        <span className="font-bold text-primary text-lg">
                                            {student.totalNet.toFixed(2)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/teacher/exams/${encodeURIComponent(classData.examName)}/students/${student.studentId}`}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
