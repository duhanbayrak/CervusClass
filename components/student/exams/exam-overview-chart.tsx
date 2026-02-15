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

interface Average {
    exam_name: string
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

const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    padding: '12px 16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

const tooltipFormatter = (value?: number | string) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'))
    return isNaN(num) ? '-' : num.toFixed(2)
}

function renderChart(chartData: any[], isBarChart: boolean, fontSize: number = 10) {
    if (isBarChart) {
        return (
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize }} interval={0} height={70} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                    formatter={tooltipFormatter}
                />
                <Legend
                    verticalAlign="top" align="right" iconType="circle"
                    wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
                />
                <Bar dataKey="Benim Netim" fill={COLORS.student} radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="Sınıf Ortalaması" fill={COLORS.class} radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="Okul Ortalaması" fill={COLORS.school} radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
        )
    }
    return (
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize }} interval={0} height={70} angle={-20} textAnchor="end" className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                formatter={tooltipFormatter}
            />
            <Legend
                verticalAlign="top" align="right" iconType="circle"
                wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
            />
            <Line
                type="monotone" dataKey="Benim Netim" stroke={COLORS.student}
                strokeWidth={3}
                dot={{ r: 5, fill: COLORS.student, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: COLORS.student, strokeWidth: 2 }}
                connectNulls
            />
            <Line
                type="monotone" dataKey="Sınıf Ortalaması" stroke={COLORS.class}
                strokeWidth={2} strokeDasharray="6 3"
                dot={{ r: 4, fill: COLORS.class, strokeWidth: 2, stroke: '#fff' }}
                connectNulls
            />
            <Line
                type="monotone" dataKey="Okul Ortalaması" stroke={COLORS.school}
                strokeWidth={2} strokeDasharray="3 3"
                dot={{ r: 4, fill: COLORS.school, strokeWidth: 2, stroke: '#fff' }}
                connectNulls
            />
        </LineChart>
    )
}

function renderModalChart(chartData: any[], isBarChart: boolean) {
    const startIndex = Math.max(0, chartData.length - 10)

    if (isBarChart) {
        return (
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} height={70} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                    formatter={tooltipFormatter}
                />
                <Legend
                    verticalAlign="top" align="right" iconType="circle"
                    wrapperStyle={{ fontSize: '14px', paddingBottom: '16px' }}
                />
                <Bar dataKey="Benim Netim" fill={COLORS.student} radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="Sınıf Ortalaması" fill={COLORS.class} radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="Okul Ortalaması" fill={COLORS.school} radius={[6, 6, 0, 0]} barSize={32} />
                <Brush
                    dataKey="label"
                    height={30}
                    stroke="hsl(var(--primary))"
                    startIndex={startIndex}
                    endIndex={chartData.length - 1}
                    travellerWidth={10}
                    fill="hsl(var(--muted))"
                />
            </BarChart>
        )
    }
    return (
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} height={70} angle={-20} textAnchor="end" />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                formatter={tooltipFormatter}
            />
            <Legend
                verticalAlign="top" align="right" iconType="circle"
                wrapperStyle={{ fontSize: '14px', paddingBottom: '16px' }}
            />
            <Line
                type="monotone" dataKey="Benim Netim" stroke={COLORS.student}
                strokeWidth={3}
                dot={{ r: 5, fill: COLORS.student, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: COLORS.student, strokeWidth: 2 }}
                connectNulls
            />
            <Line
                type="monotone" dataKey="Sınıf Ortalaması" stroke={COLORS.class}
                strokeWidth={2} strokeDasharray="6 3"
                dot={{ r: 4, fill: COLORS.class, strokeWidth: 2, stroke: '#fff' }}
                connectNulls
            />
            <Line
                type="monotone" dataKey="Okul Ortalaması" stroke={COLORS.school}
                strokeWidth={2} strokeDasharray="3 3"
                dot={{ r: 4, fill: COLORS.school, strokeWidth: 2, stroke: '#fff' }}
                connectNulls
            />
            <Brush
                dataKey="label"
                height={30}
                stroke="hsl(var(--primary))"
                startIndex={startIndex}
                endIndex={chartData.length - 1}
                travellerWidth={10}
                fill="hsl(var(--muted))"
            />
        </LineChart>
    )
}

export function ExamOverviewChart({ studentExams, classAverages, schoolAverages }: ExamOverviewChartProps) {
    const [isBarChart, setIsBarChart] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const chartData = useMemo(() => studentExams
        .filter(e => e.exam_date)
        .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())
        .map(exam => {
            const key = `${exam.exam_name}_${exam.exam_date}`
            const classAvg = classAverages.find(c => `${c.exam_name}_${c.exam_date}` === key)
            const schoolAvg = schoolAverages.find(s => `${s.exam_name}_${s.exam_date}` === key)

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
                'Benim Netim': exam.total_net ?? 0,
                'Sınıf Ortalaması': classAvg?.avg_net ?? null,
                'Okul Ortalaması': schoolAvg?.avg_net ?? null,
            }
        }), [studentExams, classAverages, schoolAverages])

    const { totalPages, defaultPage, getPageData } = usePaginatedData(chartData, 5)
    const [currentPage, setCurrentPage] = useState(defaultPage)

    const pagedData = getPageData(currentPage)

    if (chartData.length === 0) return null

    return (
        <>
            <div className="border rounded-xl bg-card p-6 shadow-sm">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Toplam Net Gelişimi</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sınav netlerinizi sınıf ve okul ortalamasıyla karşılaştırın
                        </p>
                    </div>
                    <ChartToggle isBarChart={isBarChart} onChange={setIsBarChart} />
                </div>

                <ExpandableChartWrapper onClick={() => setIsModalOpen(true)}>
                    <div className="w-full h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart(pagedData, isBarChart)}
                        </ResponsiveContainer>
                    </div>
                </ExpandableChartWrapper>

                <ChartPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            <ChartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Toplam Net Gelişimi"
                subtitle="Sınav netlerinizi sınıf ve okul ortalamasıyla karşılaştırın"
            >
                <div className="w-full h-full flex flex-col">
                    <div className="flex justify-end mb-4 shrink-0">
                        <ChartToggle isBarChart={isBarChart} onChange={setIsBarChart} />
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderModalChart(chartData, isBarChart)}
                        </ResponsiveContainer>
                    </div>
                </div>
            </ChartModal>
        </>
    )
}
