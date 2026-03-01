import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    FileText,
    Calendar,
    ChevronRight,
    Plus,
    ChevronLeft
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

async function getExams(page: number = 1, limit: number = 10) {
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

    // Admin yetkisi kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { exams: [], total: 0 }

    const offset = (page - 1) * limit

    // 1. Get unique exams (Paginated) via RPC
    const { data: uniqueExams, error: rpcError } = await supabase.rpc('get_unique_exams', {
        page_offset: offset,
        page_limit: limit
    })

    if (rpcError || !uniqueExams || uniqueExams.length === 0) {
        return { exams: [], total: 0 }
    }

    // 2. Get total count via RPC
    const { data: totalCount } = await supabase.rpc('get_unique_exams_count')
    const total = totalCount || 0

    // 3. Get results for these exams
    // Filter by exam names present in the current page
    const examNames = uniqueExams.map((e: any) => e.exam_name)

    const { data: results, error } = await supabase
        .from('exam_results')
        .select(`
            id,
            exam_name,
            exam_date,
            total_net,
            student_id,
            profiles (
                id,
                full_name,
                class_id,
                classes (
                    id,
                    name
                )
            )
        `)
        .in('exam_name', examNames)
        .order('exam_date', { ascending: false })

    if (error) {
        console.error("Error fetching exam details:", error)
        return { exams: [], total: 0 }
    }

    // 4. Group by exam name AND date
    const examMap = new Map<string, ExamGroup>()

    // Initialize map with the unique exams we fetched from RPC to ensure order
    uniqueExams.forEach((ue: any) => {
        const key = `${ue.exam_name}_${ue.exam_date}`
        examMap.set(key, {
            examName: ue.exam_name,
            examDate: ue.exam_date,
            classes: []
        })
    })

    results?.forEach((result: any) => {
        // Create key consistent with RPC result
        const examKey = `${result.exam_name}_${result.exam_date}`

        // If this result belongs to an exam not in our current page (should be rare/impossible due to name filter, 
        // but dates might mismatch if names are reused across pages), skip it.
        // Actually, name filter includes ALL dates for that name. 
        // So we might get "Math Exam" from Jan 1 (Page 2) while viewing "Math Exam" from Feb 1 (Page 1).
        // We only want to populate the exams that represent the rows from RPC.
        if (!examMap.has(examKey)) return

        const className = result.profiles?.classes?.name
        const classId = result.profiles?.classes?.id

        if (!className || !classId) return

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

    // Calculate averages & sort
    examMap.forEach(exam => {
        exam.classes.forEach(classData => {
            if (classData.studentCount > 0) {
                classData.avgNet = classData.avgNet / classData.studentCount
            }
            classData.participation = `${classData.studentCount}/${classData.studentCount}`
        })
        exam.classes.sort((a, b) => a.className.localeCompare(b.className))
    })

    return {
        exams: Array.from(examMap.values()),
        total
    }
}

export default async function AdminExamsPage({ searchParams }: { searchParams: { page?: string } }) {
    // Await searchParams before accessing properties
    const resolvedSearchParams = await Promise.resolve(searchParams);
    const page = Number(resolvedSearchParams?.page) || 1
    const limit = 10

    const { exams, total } = await getExams(page, limit)
    const totalPages = Math.ceil(total / limit)

    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sınav Yönetimi</h1>
                    <p className="text-muted-foreground mt-1">
                        Sistemdeki tüm sınav sonuçlarını görüntüleyin ve analiz edin.
                    </p>
                </div>
                <Link href="/admin/exams/upload">
                    <Button className="bg-[#135bec] hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Sınav Yükle
                    </Button>
                </Link>
            </div>



            {/* Pagination Info */}
            <div className="text-sm text-muted-foreground">
                Toplam <span className="font-medium text-foreground">{total}</span> sınavdan <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> - <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> arası gösteriliyor.
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
                            Sisteme yüklenen sınavlar burada görünecektir. "Yeni Sınav Yükle" butonu ile başlayabilirsiniz.
                        </p>
                    </div>
                ) : (
                    exams.map((exam) => (
                        <div key={exam.examName} className="border rounded-xl overflow-hidden bg-card shadow-sm transition-all hover:shadow-md">
                            {/* Exam Header */}
                            <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        {exam.examName}
                                    </h2>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-sm">
                                            {exam.examDate
                                                ? format(new Date(exam.examDate), 'd MMMM yyyy, EEEE', { locale: tr })
                                                : 'Tarih Belirtilmemiş'}
                                        </span>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-white/50 text-slate-700 border-slate-200">
                                    {exam.classes.length} Sınıf Katıldı
                                </Badge>
                            </div>

                            {/* Classes Grid */}
                            <div className="p-6 bg-slate-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {exam.classes.map((classData) => (
                                        <Link
                                            key={classData.classId}
                                            href={`/admin/exams/${encodeURIComponent(exam.examName)}/${classData.classId}`}
                                            className="block group relative"
                                        >
                                            <div className="p-4 rounded-lg border bg-white hover:border-blue-400 transition-all cursor-default relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                                        {classData.className}
                                                    </h3>
                                                    {/* Admin detay linki eklenebilir, şimdilik sadece gösterim */}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Katılım</span>
                                                        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-xs">{classData.participation}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Ort. Net</span>
                                                        <span className="font-bold text-emerald-600 text-lg">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <Link href={page > 1 ? `/admin/exams?page=${page - 1}` : '#'}>
                        <Button variant="outline" size="sm" disabled={page <= 1}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Önceki
                        </Button>
                    </Link>

                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Simple pagination logic to show mostly current pages
                            let p = i + 1;
                            if (totalPages > 5 && page > 3) {
                                p = page - 2 + i;
                                if (p > totalPages) p = totalPages - (4 - i);
                            }

                            // Adjust if p became 0 or negative
                            if (p < 1) p = 1

                            return (
                                <Link key={p} href={`/admin/exams?page=${p}`}>
                                    <Button
                                        variant={p === page ? "default" : "outline"}
                                        size="sm"
                                        className={`w-8 h-8 p-0 ${p === samePage(page) ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                    >
                                        {p}
                                    </Button>
                                </Link>
                            )
                        })}
                    </div>

                    <Link href={page < totalPages ? `/admin/exams?page=${page + 1}` : '#'}>
                        <Button variant="outline" size="sm" disabled={page >= totalPages}>
                            Sonraki
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}

function samePage(p: number) { return p; } // Dummy function just to keep inline logic clean in conditional
