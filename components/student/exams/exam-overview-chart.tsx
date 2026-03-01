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
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatXAxisTick } from '@/lib/utils'
import { ChartToggle } from './chart-toggle'
import { ChartModal, ExpandableChartWrapper } from './chart-modal'
import { ChartPagination, usePaginatedData } from './chart-pagination'
import { ExpandedExamChart } from './expanded-exam-chart'
import { CustomTooltip } from './custom-tooltip'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ExamResult {
    id: string
    created_at: string
    exam_name: string
    exam_type: 'TYT' | 'AYT'
    exam_date: string | null
    total_net: number | null
    scores: any
}

interface Average {
    exam_name: string
    exam_type: 'TYT' | 'AYT'
    exam_date: string
    avg_net: number
}

interface ExamOverviewChartProps {
    studentExams: ExamResult[]
    classAverages: Average[]
    schoolAverages: Average[]
}

const COLORS = {
    student: '#3b82f6',
    class: '#f59e0b',
    school: '#10b981',
}



function renderChart(chartData: any[], isBarChart: boolean, yDomain: [number, number], hasNegative: boolean, fontSize: number = 10) {
    if (isBarChart) {
        return (
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize }} interval="preserveStartEnd" height={70} angle={-20} textAnchor="end" tickFormatter={formatXAxisTick} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={true} domain={yDomain} tickCount={8} />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'transparent' }}
                    isAnimationActive={false}
                    allowEscapeViewBox={{ x: false, y: false }}
                />
                <Legend
                    verticalAlign="top" align="right" iconType="circle"
                    wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
                />
                {hasNegative && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />}
                <Bar name="Benim Netim" dataKey="student_net" fill={COLORS.student} radius={[6, 6, 0, 0]} barSize={24} />
                <Bar name="Sınıf Ortalaması" dataKey="class_net" fill={COLORS.class} radius={[6, 6, 0, 0]} barSize={24} />
                <Bar name="Okul Ortalaması" dataKey="school_net" fill={COLORS.school} radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
        )
    }
    return (
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize }} interval="preserveStartEnd" height={70} angle={-20} textAnchor="end" className="text-muted-foreground" tickFormatter={formatXAxisTick} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={true} domain={yDomain} tickCount={8} className="text-muted-foreground" />
            <Tooltip
                content={<CustomTooltip />}
                isAnimationActive={false}
                allowEscapeViewBox={{ x: false, y: false }}
            />
            <Legend
                verticalAlign="top" align="right" iconType="circle"
                wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
            />
            {hasNegative && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />}
            <Line
                name="Benim Netim"
                type="monotone" dataKey="student_net" stroke={COLORS.student}
                strokeWidth={3}
                dot={{ r: 5, fill: COLORS.student, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: COLORS.student, strokeWidth: 2 }}
                connectNulls={true}
            />
            <Line
                name="Sınıf Ortalaması"
                type="monotone" dataKey="class_net" stroke={COLORS.class}
                strokeWidth={2} strokeDasharray="6 3"
                dot={{ r: 4, fill: COLORS.class, strokeWidth: 2, stroke: '#fff' }}
                connectNulls={true}
            />
            <Line
                name="Okul Ortalaması"
                type="monotone" dataKey="school_net" stroke={COLORS.school}
                strokeWidth={2} strokeDasharray="3 3"
                dot={{ r: 4, fill: COLORS.school, strokeWidth: 2, stroke: '#fff' }}
                connectNulls={true}
            />
        </LineChart>
    )
}

export function ExamOverviewChart({ studentExams, classAverages, schoolAverages }: ExamOverviewChartProps) { // NOSONAR
    const [isBarChart, setIsBarChart] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'TYT' | 'AYT'>('TYT')

    // 1. Separate data streams
    const tytExams = useMemo(() => studentExams.filter(e => e.exam_type === 'TYT'), [studentExams])
    const aytExams = useMemo(() => studentExams.filter(e => e.exam_type === 'AYT'), [studentExams])

    // 2. Select current data
    const currentExams = activeTab === 'TYT' ? tytExams : aytExams

    const chartData = useMemo(() => currentExams
        .filter(e => e.exam_date)
        .sort((a, b) => {
            const dateA = a.exam_date ? new Date(a.exam_date).getTime() : 0;
            const dateB = b.exam_date ? new Date(b.exam_date).getTime() : 0;
            if (dateA !== dateB) return dateA - dateB;

            // Secondary sort: created_at (oldest first)
            const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (createdA !== createdB) return createdA - createdB;

            return String(a.id).localeCompare(String(b.id));
        })
        .map(exam => {
            const classAvg = classAverages.find(c => c.exam_name === exam.exam_name && c.exam_type === exam.exam_type)
            const schoolAvg = schoolAverages.find(s => s.exam_name === exam.exam_name && s.exam_type === exam.exam_type)

            const shortName = exam.exam_name
                .replace(/\.xlsx?$/i, '')
                .replace(/mock_exam_/i, 'Deneme ')
                .replaceAll(/_/g, ' ')
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
                created_at: exam.created_at, // Pass created_at for secondary sorting in modal
                student_net: exam.total_net ?? null,
                class_net: classAvg?.avg_net ?? null,
                school_net: schoolAvg?.avg_net ?? null,
            }
        }), [currentExams, classAverages, schoolAverages])

    // Y ekseni domain hesaplama
    const { yDomain, hasNegative } = useMemo(() => {
        const allNets = chartData.flatMap(d => [d.student_net, d.class_net, d.school_net]).filter((v): v is number => v !== null);
        if (allNets.length === 0) return { yDomain: [0, 100] as [number, number], hasNegative: false };
        const minVal = Math.min(...allNets);
        const maxVal = Math.max(...allNets);
        const hasNeg = minVal < 0;
        const yMin = hasNeg ? Math.floor(minVal - 5) : 0;
        const yMax = Math.ceil(maxVal + 10);
        return { yDomain: [yMin, yMax] as [number, number], hasNegative: hasNeg };
    }, [chartData])

    const { totalPages, defaultPage, getPageData } = usePaginatedData(chartData, 5)
    // When using pagination/slice directly, we might not need separate state for pages if only showing chart.
    // But ExamOverviewChart shows a paginated chart on dashboard.
    // ExpandedExamChart will show filtered data.
    const [currentPage, setCurrentPage] = useState(defaultPage)

    const pagedData = getPageData(currentPage)

    // Log the final consolidated data structure as requested
    console.log("Final Merged Chart Data: ", chartData);

    // Removed the early return for empty data to allow showing empty state within tabs if needed? 
    // Actually, if we have NO exams for a category, chartData is empty. We should handle empty state gracefully.
    // However, if we return null, the whole component disappears. 
    // Better to show the Toggles and "No Data" message.

    return (
        <>
            <div className="border rounded-xl bg-card p-6 shadow-sm">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Toplam Net Gelişimi</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sınav netlerinizi sınıf ve okul ortalamasıyla karşılaştırın
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'TYT' | 'AYT')}>
                            <TabsList>
                                <TabsTrigger value="TYT">TYT</TabsTrigger>
                                <TabsTrigger value="AYT">AYT</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <ChartToggle isBarChart={isBarChart} onChange={setIsBarChart} />
                    </div>
                </div>

                {chartData.length > 0 ? (
                    <>
                        <ExpandableChartWrapper onClick={() => setIsModalOpen(true)}>
                            <div className="w-full">
                                <ResponsiveContainer width="100%" height={450}>
                                    {renderChart(pagedData, isBarChart, yDomain, hasNegative)}
                                </ResponsiveContainer>
                            </div>
                        </ExpandableChartWrapper>

                        <ChartPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                ) : (
                    <div className="h-[450px] flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                        <p className="text-muted-foreground">Bu kategoride henüz sınav verisi bulunmuyor.</p>
                    </div>
                )}
            </div>

            <ChartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Toplam Net Gelişimi (${activeTab})`}
                subtitle="Sınav netlerinizi detaylı inceleyin ve karşılaştırın"
            >
                <ExpandedExamChart data={chartData} />
            </ChartModal>
        </>
    )
}
