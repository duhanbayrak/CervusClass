import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    FileText,
    Users,
    TrendingUp,
    Calendar,
    ChevronRight,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ExamGroup {
    examName: string
    examDate: string | null
    classes: ClassExamData[]
}

interface ClassExamData {
    classId: string
    className: string
    studentCount: number
    avgNet: number
    participation: string
}

async function getExamsByClass() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // NOSONAR
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    )

    // Get all exam results with student and class info
    const { data: results, error } = await supabase
        .from('exam_results')
        .select(`
            id,
            exam_name,
            exam_date,
            total_net,
            student_id,
            profiles!inner (
                id,
                full_name,
                class_id,
                classes!inner (
                    id,
                    name
                )
            )
        `)
        .order('exam_date', { ascending: false })

    if (error) {
        return []
    }



    // Group by exam name and class
    const examMap = new Map<string, ExamGroup>()

    results?.forEach((result: any) => {
        const examKey = result.exam_name
        const className = result.profiles?.classes?.name
        const classId = result.profiles?.classes?.id

        if (!className || !classId) return

        if (!examMap.has(examKey)) {
            examMap.set(examKey, {
                examName: result.exam_name,
                examDate: result.exam_date,
                classes: []
            })
        }

        const exam = examMap.get(examKey)!
        let classData = exam.classes.find(c => c.classId === classId)

        if (!classData) {
            classData = {
                classId,
                className,
                studentCount: 0,
                avgNet: 0,
                participation: '0/0'
            }
            exam.classes.push(classData)
        }

        classData.studentCount++
        classData.avgNet += result.total_net || 0
    })

    // Calculate averages
    examMap.forEach(exam => {
        exam.classes.forEach(classData => {
            if (classData.studentCount > 0) {
                classData.avgNet = classData.avgNet / classData.studentCount
            }
            classData.participation = `${classData.studentCount}/${classData.studentCount}`
        })
        // Sort classes by name
        exam.classes.sort((a, b) => a.className.localeCompare(b.className))
    })

    return Array.from(examMap.values())
}

export default async function TeacherExamsPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // NOSONAR
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

    const exams = await getExamsByClass()

    // Calculate summary stats
    const totalExams = exams.length
    const totalClasses = exams.reduce((sum, exam) => sum + exam.classes.length, 0)
    const avgClassNet = totalClasses > 0
        ? exams.reduce((sum, exam) =>
            sum + exam.classes.reduce((s, c) => s + c.avgNet, 0), 0
        ) / totalClasses
        : 0

    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sınav Yönetimi</h1>
                    <p className="text-muted-foreground mt-1">
                        Sınıf bazında sınav sonuçlarını görüntüleyin ve analiz edin
                    </p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Toplam Sınav</p>
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold">{totalExams}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Toplam Sınıf</p>
                        <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold">{totalClasses}</p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-medium">Ortalama Net</p>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold">{avgClassNet.toFixed(1)}</p>
                </div>
            </div>

            {/* Exams List */}
            <div className="space-y-8">
                {exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
                        <div className="p-4 rounded-full bg-background border mb-4">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">Henüz Sınav Yok</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1">
                            Sisteme yüklenen sınavlar burada görünecektir.
                        </p>
                    </div>
                ) : (
                    exams.map((exam) => (
                        <div key={exam.examName} className="border rounded-xl overflow-hidden bg-card">
                            {/* Exam Header */}
                            <div className="p-6 border-b bg-muted/30">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold">{exam.examName}</h2>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-sm">
                                                {exam.examDate
                                                    ? format(new Date(exam.examDate), 'd MMMM yyyy', { locale: tr })
                                                    : 'Tarih Belirtilmemiş'}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        {exam.classes.length} Sınıf
                                    </Badge>
                                </div>
                            </div>

                            {/* Classes Grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {exam.classes.map((classData) => (
                                        <Link
                                            key={classData.classId}
                                            href={`/teacher/exams/${encodeURIComponent(exam.examName)}/${classData.classId}`}
                                            className="block group"
                                        >
                                            <div className="p-5 rounded-lg border bg-background hover:bg-accent/50 transition-all cursor-pointer hover:shadow-md">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                                                        {classData.className}
                                                    </h3>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Öğrenci</span>
                                                        <span className="font-medium">{classData.participation}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Ortalama Net</span>
                                                        <span className="font-bold text-primary text-base">
                                                            {classData.avgNet.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
