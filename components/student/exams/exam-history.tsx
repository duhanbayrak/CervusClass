'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    CheckCircle2,
    ChevronRight,
    FileText,
    Calendar,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ExamResults {
    id: string
    exam_name: string
    exam_type: 'TYT' | 'AYT'
    exam_date: string | null
    total_net: number | null
    scores: any
}

interface ExamHistoryProps {
    exams: ExamResults[]
    role?: 'student' | 'teacher'
    studentId?: string
}

export function ExamHistory({ exams, role = 'student', studentId }: ExamHistoryProps) {
    const [filter, setFilter] = useState<'ALL' | 'TYT' | 'AYT'>('ALL')

    const filteredExams = exams.filter(exam => {
        if (filter === 'ALL') return true
        return exam.exam_type === filter
    })

    if (exams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl bg-muted/30">
                <div className="p-4 rounded-full bg-background border mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Henüz Sınav Kaydı Yok</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    {role === 'teacher' ? 'Öğrencinin henüz bir sınav kaydı bulunmamaktadır.' : 'Girdiğiniz deneme sınavları sisteme yüklendiğinde burada görünecektir.'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Tabs defaultValue="ALL" className="w-[400px]" onValueChange={(v) => setFilter(v as 'ALL' | 'TYT' | 'AYT')}>
                    <TabsList>
                        <TabsTrigger value="ALL">Tümü</TabsTrigger>
                        <TabsTrigger value="TYT">TYT</TabsTrigger>
                        <TabsTrigger value="AYT">AYT</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="space-y-4">
                {filteredExams.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">Bu kategoride sınav sonucu bulunamadı.</p>
                    </div>
                ) : (
                    filteredExams.map((exam) => (
                        <Link
                            key={exam.id}
                            href={role === 'teacher'
                                ? `/teacher/exams/${encodeURIComponent(exam.exam_name)}/students/${studentId}`
                                : `/student/exams/${exam.id}`
                            }
                            className="block group"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all cursor-pointer shadow-sm hover:shadow-md gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                                {exam.exam_name}
                                            </h4>
                                            {exam.exam_type === 'TYT' && (
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                                                    TYT
                                                </Badge>
                                            )}
                                            {exam.exam_type === 'AYT' && (
                                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                                                    AYT
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>
                                                {exam.exam_date
                                                    ? format(new Date(exam.exam_date), 'd MMMM yyyy', { locale: tr })
                                                    : 'Tarih Belirtilmemiş'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground font-medium uppercase">Toplam Net</p>
                                        <p className="font-bold text-lg text-primary">{exam.total_net ?? '-'}</p>
                                    </div>

                                    <Badge variant="secondary" className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                                        Açıklandı
                                    </Badge>

                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
