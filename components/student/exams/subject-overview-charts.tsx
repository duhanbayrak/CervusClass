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
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

import { formatXAxisTick, flattenExamScores } from '@/lib/utils'
import { ChartToggle } from './chart-toggle'
import { ChartModal, ExpandableChartWrapper } from './chart-modal'
import { ChartPagination, usePaginatedData } from './chart-pagination'
import { ExpandedExamChart } from './expanded-exam-chart'
import { CustomTooltip } from './custom-tooltip'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Eye } from 'lucide-react'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ExamResult {
    id: string
    exam_name: string
    exam_type: 'TYT' | 'AYT'
    exam_date: string | null
    total_net: number | null
    scores: any
    created_at: string
}

interface SubjectOverview {
    exam_name: string
    exam_type: 'TYT' | 'AYT'
    exam_date: string
    subjects: Record<string, number>
}

interface SubjectOverviewChartsProps {
    studentExams: ExamResult[]
    classSubjectOverview: SubjectOverview[]
    schoolSubjectOverview: SubjectOverview[]
}

function findSubjectOverview(overviews: SubjectOverview[], examName: string, examType: string): SubjectOverview | undefined {
    return overviews.find(o => o.exam_name === examName && o.exam_type === examType)
}

function sortExamsByDate(a: ExamResult, b: ExamResult): number {
    const dateA = a.exam_date ? new Date(a.exam_date).getTime() : 0;
    const dateB = b.exam_date ? new Date(b.exam_date).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (createdA !== createdB) return createdA - createdB;
    return String(a.id).localeCompare(String(b.id));
}

const COLORS = {
    student: '#3b82f6',
    class: '#f59e0b',
    school: '#10b981',
}

// Study Tracks Configuration
const TRACKS = {
    SAYISAL: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'],
    ESIT_AGIRLIK: ['Matematik', 'Edebiyat', 'Tarih-1', 'Coğrafya-1'],
    SOZEL: ['Edebiyat', 'Tarih-1', 'Coğrafya-1', 'Tarih-2', 'Coğrafya-2', 'Felsefe', 'Din Kültürü'],
    ALL: [] as string[] // Special case to show all
};

interface VisibleSeries {
    student: boolean
    class: boolean
    school: boolean
}

function computeYAxisConfig(data: any[], dataKeys: string[]) {
    const values = data.flatMap(d =>
        dataKeys.map(k => d[k]).filter(v => v != null && typeof v === 'number')
    )

    if (values.length === 0) return {}

    const min = Math.min(...values)
    const max = Math.max(...values)

    // No negative values - use default Recharts behavior
    if (min >= 0) return {}

    // Has negative values - compute tight domain & ticks
    const yMin = Math.floor(min) // e.g. -0.75 → -1
    let step: number;
    if (max > 20) step = 10;
    else if (max > 10) step = 5;
    else if (max > 5) step = 2;
    else step = 1;
    const yMax = Math.ceil(max / step) * step

    // Generate ticks: include yMin, 0, then positive steps
    const ticks = [yMin, 0]
    for (let t = step; t <= yMax; t += step) {
        ticks.push(t)
    }

    return { domain: [yMin, yMax] as [number, number], ticks }
}

function renderSubjectChart(data: any[], isBarChart: boolean, visibleSeries: VisibleSeries, fontSize: number = 9) {
    const yAxisConfig = computeYAxisConfig(data, ['student_net', 'class_net', 'school_net'])
    const hasNegative = !!yAxisConfig.domain

    const CommonAxis = (
        <>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
                dataKey="label"
                tick={{ fontSize }}
                interval="preserveStartEnd"
                height={60}
                angle={-20}
                textAnchor="end"
                tickFormatter={formatXAxisTick}
                axisLine={!hasNegative}
                tickLine={!hasNegative}
            />
            <YAxis
                tick={{ fontSize: 11 }}
                allowDecimals={true}
                {...(yAxisConfig.domain ? { domain: yAxisConfig.domain } : {})}
                {...(yAxisConfig.ticks ? { ticks: yAxisConfig.ticks } : {})}
            />
            <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'transparent' }}
                isAnimationActive={false}
                allowEscapeViewBox={{ x: false, y: false }}
            />
            <Legend verticalAlign="top" height={36} />
        </>
    )

    if (isBarChart) {
        return (
            <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                {CommonAxis}
                {hasNegative && <ReferenceLine y={0} stroke="#999" strokeWidth={1.5} />}
                {visibleSeries.student && <Bar dataKey="student_net" fill={COLORS.student} radius={[4, 4, 0, 0]} barSize={16} name="Ben" />}
                {visibleSeries.class && <Bar dataKey="class_net" fill={COLORS.class} radius={[4, 4, 0, 0]} barSize={16} name="Sınıf" />}
                {visibleSeries.school && <Bar dataKey="school_net" fill={COLORS.school} radius={[4, 4, 0, 0]} barSize={16} name="Okul" />}
            </BarChart>
        )
    }
    return (
        <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
            {CommonAxis}
            {hasNegative && <ReferenceLine y={0} stroke="hsl(var(--foreground) / 0.3)" strokeWidth={1.5} />}
            {visibleSeries.student && (
                <Line
                    type="monotone" dataKey="student_net" stroke={COLORS.student}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: COLORS.student, strokeWidth: 2, stroke: '#fff' }}
                    connectNulls={true}
                    name="Ben"
                />
            )}
            {visibleSeries.class && (
                <Line
                    type="monotone" dataKey="class_net" stroke={COLORS.class}
                    strokeWidth={1.5} strokeDasharray="6 3"
                    dot={{ r: 3, fill: COLORS.class, strokeWidth: 1, stroke: '#fff' }}
                    connectNulls={true}
                    name="Sınıf"
                />
            )}
            {visibleSeries.school && (
                <Line
                    type="monotone" dataKey="school_net" stroke={COLORS.school}
                    strokeWidth={1.5} strokeDasharray="3 3"
                    dot={{ r: 3, fill: COLORS.school, strokeWidth: 1, stroke: '#fff' }}
                    connectNulls={true}
                    name="Okul"
                />
            )}
        </LineChart>
    )
}

export function SubjectOverviewCharts({ // NOSONAR
    studentExams,
    classSubjectOverview,
    schoolSubjectOverview,
}: Readonly<SubjectOverviewChartsProps>) {
    const [isBarChart, setIsBarChart] = useState(false)
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'TYT' | 'AYT'>('TYT')
    const [selectedTrack, setSelectedTrack] = useState<string>('ALL')

    // Default all visible
    const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
        student: true,
        class: true,
        school: true
    })

    // Filter exams by active tab first
    const filteredExams = useMemo(() => {
        return studentExams.filter(exam => exam.exam_type === activeTab)
    }, [studentExams, activeTab])

    // Collect all unique subjects available from the flattened scores
    const allSubjects = useMemo(() => {
        const subjects = new Set<string>()
        filteredExams.forEach(exam => {
            const flatScores = flattenExamScores(exam.scores, activeTab)
            Object.keys(flatScores).forEach(s => subjects.add(s))
        })
        return subjects
    }, [filteredExams, activeTab])

    // Generate chart data for each subject
    const subjectCharts = useMemo(() => {
        return Array.from(allSubjects).map(subject => {
            const data = filteredExams
                .filter(e => e.exam_date)
                .sort(sortExamsByDate)
                .map(exam => {
                    const flatScores = flattenExamScores(exam.scores, activeTab)
                    const studentNet = flatScores[subject] ?? null

                    const classAvg = findSubjectOverview(classSubjectOverview, exam.exam_name, exam.exam_type)
                    const schoolAvg = findSubjectOverview(schoolSubjectOverview, exam.exam_name, exam.exam_type)

                    const shortName = exam.exam_name
                        .replace(/\.xlsx?$/i, '')
                        .replace(/mock_exam_/i, 'Deneme ')
                        .replaceAll('_', ' ')
                        .trim()
                    const dateStr = exam.exam_date
                        ? format(new Date(exam.exam_date), 'd MMM', { locale: tr })
                        : ''

                    return {
                        exam_date: exam.exam_date,
                        exam_name: exam.exam_name,
                        name: exam.exam_name,
                        label: `${shortName} (${dateStr})`,
                        fullDate: exam.exam_date
                            ? format(new Date(exam.exam_date), 'd MMMM yyyy', { locale: tr })
                            : '',
                        originalDate: exam.exam_date ? new Date(exam.exam_date) : null,
                        created_at: exam.created_at,
                        student_net: studentNet,
                        class_net: classAvg?.subjects[subject] ?? null,
                        school_net: schoolAvg?.subjects[subject] ?? null,
                    }
                })

            return { subject, data }
        }).filter(sc => sc.data.some((d: any) => d.student_net !== null))
    }, [allSubjects, filteredExams, classSubjectOverview, schoolSubjectOverview, activeTab])

    // Filter charts based on selected track (only for AYT)
    const visibleSubjectCharts = useMemo(() => {
        if (activeTab === 'TYT' || selectedTrack === 'ALL') {
            return subjectCharts
        }

        const allowedSubjects = TRACKS[selectedTrack as keyof typeof TRACKS] || []
        return subjectCharts.filter(sc => {
            // Case-insensitive match or direct match
            const normalizedSubject = sc.subject.toLowerCase()
            return allowedSubjects.some(s => s.toLowerCase() === normalizedSubject)
        })
    }, [subjectCharts, activeTab, selectedTrack])

    // Tüm ders kartları aynı sayfada: ortak data uzunluğuna göre sayfalama
    const maxDataLength = Math.max(...visibleSubjectCharts.map(sc => sc.data.length), 0)
    const { totalPages, defaultPage, getPageData } = usePaginatedData(
        Array.from({ length: maxDataLength }, (_, i) => i),
        5
    )
    const [currentPage, setCurrentPage] = useState(defaultPage)

    const expandedChart = subjectCharts.find(sc => sc.subject === expandedSubject)

    // Sayfa indekslerine göre her dersin datasını kes
    const pageIndices = getPageData(currentPage)
    const pageStart = pageIndices[0] ?? 0
    const pageEnd = (pageIndices.at(-1) ?? 0) + 1 // NOSONAR

    return (
        <>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-semibold tracking-tight">Ders Bazlı Net Gelişimi</h2>
                        <p className="text-sm text-muted-foreground">
                            Her ders için net değişiminizi sınıf ve okul ortalamasıyla karşılaştırın
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2">
                                    <Eye className="w-4 h-4" />
                                    Görünüm
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-4" align="end">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm leading-none mb-2">Grafik Verileri</h4>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="show-student"
                                                checked={visibleSeries.student}
                                                onCheckedChange={(checked) => setVisibleSeries(prev => ({ ...prev, student: !!checked }))}
                                            />
                                            <label htmlFor="show-student" className="text-sm font-medium leading-none cursor-pointer">
                                                Benim Netim
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="show-class"
                                                checked={visibleSeries.class}
                                                onCheckedChange={(checked) => setVisibleSeries(prev => ({ ...prev, class: !!checked }))}
                                            />
                                            <label htmlFor="show-class" className="text-sm font-medium leading-none cursor-pointer">
                                                Sınıf Ortalaması
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="show-school"
                                                checked={visibleSeries.school}
                                                onCheckedChange={(checked) => setVisibleSeries(prev => ({ ...prev, school: !!checked }))}
                                            />
                                            <label htmlFor="show-school" className="text-sm font-medium leading-none cursor-pointer">
                                                Okul Ortalaması
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {activeTab === 'AYT' && (
                            <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Alanını Seç" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tüm Dersler</SelectItem>
                                    <SelectItem value="SAYISAL">Sayısal</SelectItem>
                                    <SelectItem value="ESIT_AGIRLIK">Eşit Ağırlık</SelectItem>
                                    <SelectItem value="SOZEL">Sözel</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'TYT' | 'AYT')}>
                            <TabsList>
                                <TabsTrigger value="TYT">TYT</TabsTrigger>
                                <TabsTrigger value="AYT">AYT</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <ChartToggle isBarChart={isBarChart} onChange={setIsBarChart} />
                    </div>
                </div>

                {visibleSubjectCharts.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                        <p className="text-muted-foreground">Bu kategoride ders bazlı veri bulunamadı.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {visibleSubjectCharts.map(({ subject, data }) => {
                                const pagedData = data.slice(pageStart, pageEnd)
                                return (
                                    <div key={subject} className="border rounded-xl bg-card p-5 shadow-sm">
                                        <h3 className="text-base font-semibold mb-4">{subject}</h3>
                                        <ExpandableChartWrapper onClick={() => setExpandedSubject(subject)}>
                                            <div className="w-full">
                                                <ResponsiveContainer width="100%" height={300}>
                                                    {renderSubjectChart(pagedData, isBarChart, visibleSeries)}
                                                </ResponsiveContainer>
                                            </div>
                                        </ExpandableChartWrapper>
                                    </div>
                                )
                            })}
                        </div>
                        <ChartPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>

            {expandedChart && (
                <ChartModal
                    isOpen={!!expandedSubject}
                    onClose={() => setExpandedSubject(null)}
                    title={`${expandedChart.subject} (${activeTab})`}
                    subtitle="Ders bazlı net değişiminizi sınıf ve okul ortalamasıyla karşılaştırın"
                >
                    <div className="w-full h-full flex flex-col">
                        <div className="flex-1 min-h-0">
                            {/* Use ExpandedExamChart for the modal view */}
                            <ExpandedExamChart data={expandedChart.data} />
                        </div>
                    </div>
                </ChartModal>
            )}
        </>
    )
}
