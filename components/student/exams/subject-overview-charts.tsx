'use client'

import { useState, useMemo } from 'react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Brush,
    ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChartToggle } from './chart-toggle'
import { ChartModal, ExpandableChartWrapper } from './chart-modal'
import { ChartPagination, usePaginatedData } from './chart-pagination'

interface ExamResult {
    id: string
    exam_name: string
    exam_date: string | null
    total_net: number | null
    scores: any
}

interface SubjectOverview {
    exam_name: string
    exam_date: string
    subjects: Record<string, number>
}

interface SubjectOverviewChartsProps {
    studentExams: ExamResult[]
    classSubjectOverview: SubjectOverview[]
    schoolSubjectOverview: SubjectOverview[]
}

const COLORS = {
    student: '#3b82f6',
    class: '#f59e0b',
    school: '#10b981',
}

const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    padding: '10px 14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

const tooltipFormatter = (value?: number | string) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'))
    return isNaN(num) ? '-' : num.toFixed(2)
}

function renderSubjectChart(data: any[], isBarChart: boolean, fontSize: number = 9) {
    if (isBarChart) {
        return (
            <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize }} interval={0} height={60} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                    formatter={tooltipFormatter}
                />
                <Bar dataKey="Benim Netim" fill={COLORS.student} radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Sınıf Ortalaması" fill={COLORS.class} radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Okul Ortalaması" fill={COLORS.school} radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
        )
    }
    return (
        <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize }} interval={0} height={60} angle={-20} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                formatter={tooltipFormatter}
            />
            <Line
                type="monotone" dataKey="Benim Netim" stroke={COLORS.student}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS.student, strokeWidth: 2, stroke: '#fff' }}
                connectNulls
            />
            <Line
                type="monotone" dataKey="Sınıf Ortalaması" stroke={COLORS.class}
                strokeWidth={1.5} strokeDasharray="6 3"
                dot={{ r: 3, fill: COLORS.class, strokeWidth: 1, stroke: '#fff' }}
                connectNulls
            />
            <Line
                type="monotone" dataKey="Okul Ortalaması" stroke={COLORS.school}
                strokeWidth={1.5} strokeDasharray="3 3"
                dot={{ r: 3, fill: COLORS.school, strokeWidth: 1, stroke: '#fff' }}
                connectNulls
            />
        </LineChart>
    )
}

function renderSubjectModalChart(data: any[], isBarChart: boolean) {
    const startIndex = Math.max(0, data.length - 10)

    if (isBarChart) {
        return (
            <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} height={60} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                    formatter={tooltipFormatter}
                />
                <Bar dataKey="Benim Netim" fill={COLORS.student} radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Sınıf Ortalaması" fill={COLORS.class} radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Okul Ortalaması" fill={COLORS.school} radius={[4, 4, 0, 0]} barSize={24} />
                <Brush
                    dataKey="label"
                    height={30}
                    stroke="hsl(var(--primary))"
                    startIndex={startIndex}
                    endIndex={data.length - 1}
                    travellerWidth={10}
                    fill="hsl(var(--muted))"
                />
            </BarChart>
        )
    }
    return (
        <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} height={60} angle={-20} textAnchor="end" />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                formatter={tooltipFormatter}
            />
            <Line
                type="monotone" dataKey="Benim Netim" stroke={COLORS.student}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS.student, strokeWidth: 2, stroke: '#fff' }}
                connectNulls
            />
            <Line
                type="monotone" dataKey="Sınıf Ortalaması" stroke={COLORS.class}
                strokeWidth={1.5} strokeDasharray="6 3"
                dot={{ r: 3, fill: COLORS.class, strokeWidth: 1, stroke: '#fff' }}
                connectNulls
            />
            <Line
                type="monotone" dataKey="Okul Ortalaması" stroke={COLORS.school}
                strokeWidth={1.5} strokeDasharray="3 3"
                dot={{ r: 3, fill: COLORS.school, strokeWidth: 1, stroke: '#fff' }}
                connectNulls
            />
            <Brush
                dataKey="label"
                height={30}
                stroke="hsl(var(--primary))"
                startIndex={startIndex}
                endIndex={data.length - 1}
                travellerWidth={10}
                fill="hsl(var(--muted))"
            />
        </LineChart>
    )
}

export function SubjectOverviewCharts({
    studentExams,
    classSubjectOverview,
    schoolSubjectOverview,
}: SubjectOverviewChartsProps) {
    const [isBarChart, setIsBarChart] = useState(false)
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

    // Tüm dersleri topla
    const allSubjects = useMemo(() => {
        const subjects = new Set<string>()
        studentExams.forEach(exam => {
            let scores = exam.scores
            if (typeof scores === 'string') {
                try { scores = JSON.parse(scores) } catch { scores = null }
            }
            if (scores && typeof scores === 'object') {
                Object.keys(scores).forEach(s => subjects.add(s))
            }
        })
        return subjects
    }, [studentExams])

    // Her ders için zaman serisi datası oluştur
    const subjectCharts = useMemo(() => {
        return Array.from(allSubjects).map(subject => {
            const data = studentExams
                .filter(e => e.exam_date)
                .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())
                .map(exam => {
                    let scores = exam.scores
                    if (typeof scores === 'string') {
                        try { scores = JSON.parse(scores) } catch { scores = null }
                    }

                    const subjectData = scores?.[subject]
                    const studentNet = typeof subjectData === 'number' ? subjectData : (subjectData?.net ?? null)

                    const key = `${exam.exam_name}_${exam.exam_date}`
                    const classAvg = classSubjectOverview.find(c => `${c.exam_name}_${c.exam_date}` === key)
                    const schoolAvg = schoolSubjectOverview.find(s => `${s.exam_name}_${s.exam_date}` === key)

                    const shortName = exam.exam_name
                        .replace(/\.xlsx?$/i, '')
                        .replace(/mock_exam_/i, 'Deneme ')
                        .replace(/_/g, ' ')
                        .trim()
                    const dateStr = exam.exam_date
                        ? format(new Date(exam.exam_date), 'd MMM', { locale: tr })
                        : ''

                    return {
                        name: exam.exam_name,
                        label: `${shortName} (${dateStr})`,
                        fullDate: exam.exam_date
                            ? format(new Date(exam.exam_date), 'd MMMM yyyy', { locale: tr })
                            : '',
                        'Benim Netim': studentNet,
                        'Sınıf Ortalaması': classAvg?.subjects[subject] ?? null,
                        'Okul Ortalaması': schoolAvg?.subjects[subject] ?? null,
                    }
                })
                .filter(d => d['Benim Netim'] !== null)

            return { subject, data }
        }).filter(sc => sc.data.length > 0)
    }, [allSubjects, studentExams, classSubjectOverview, schoolSubjectOverview])

    // Tüm ders kartları aynı sayfada: ortak data uzunluğuna göre sayfalama
    const maxDataLength = Math.max(...subjectCharts.map(sc => sc.data.length), 0)
    const { totalPages, defaultPage, getPageData } = usePaginatedData(
        Array.from({ length: maxDataLength }, (_, i) => i),
        5
    )
    const [currentPage, setCurrentPage] = useState(defaultPage)

    if (allSubjects.size === 0 || subjectCharts.length === 0) return null

    const expandedChart = subjectCharts.find(sc => sc.subject === expandedSubject)

    // Sayfa indekslerine göre her dersin datasını kes
    const pageIndices = getPageData(currentPage)
    const pageStart = pageIndices[0] ?? 0
    const pageEnd = (pageIndices[pageIndices.length - 1] ?? 0) + 1

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-semibold tracking-tight">Ders Bazlı Net Gelişimi</h2>
                        <p className="text-sm text-muted-foreground">
                            Her ders için net değişiminizi sınıf ve okul ortalamasıyla karşılaştırın
                        </p>
                    </div>
                    <ChartToggle isBarChart={isBarChart} onChange={setIsBarChart} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectCharts.map(({ subject, data }) => {
                        const pagedData = data.slice(pageStart, pageEnd)
                        return (
                            <div key={subject} className="border rounded-xl bg-card p-5 shadow-sm">
                                <h3 className="text-base font-semibold mb-4">{subject}</h3>
                                <ExpandableChartWrapper onClick={() => setExpandedSubject(subject)}>
                                    <div className="w-full h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {renderSubjectChart(pagedData, isBarChart)}
                                        </ResponsiveContainer>
                                    </div>
                                </ExpandableChartWrapper>
                                {/* Renk açıklamaları */}
                                <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.student }} />
                                        <span className="text-muted-foreground">Ben</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.class }} />
                                        <span className="text-muted-foreground">Sınıf</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.school }} />
                                        <span className="text-muted-foreground">Okul</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <ChartPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {expandedChart && (
                <ChartModal
                    isOpen={!!expandedSubject}
                    onClose={() => setExpandedSubject(null)}
                    title={expandedChart.subject}
                    subtitle="Ders bazlı net değişiminizi sınıf ve okul ortalamasıyla karşılaştırın"
                >
                    <div className="w-full h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.student }} />
                                    <span>Ben</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.class }} />
                                    <span>Sınıf</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.school }} />
                                    <span>Okul</span>
                                </div>
                            </div>
                            <ChartToggle isBarChart={isBarChart} onChange={setIsBarChart} />
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderSubjectModalChart(expandedChart.data, isBarChart)}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </ChartModal>
            )}
        </>
    )
}
