'use client'

import { useState } from 'react'
import {
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
import { flattenExamScores } from '@/lib/utils'
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
import { ChartModal, ExpandableChartWrapper } from './chart-modal'

interface ExamDetailChartsProps {
    scores: Record<string, any>
    examType: 'TYT' | 'AYT'
    totalNet: number | null
    classSubjectAverages: Record<string, number>
    classTotalAvg: number
    schoolSubjectAverages: Record<string, number>
    schoolTotalAvg: number
}

const COLORS = {
    student: '#3b82f6',
    class: '#f59e0b',
    school: '#10b981',
}

function computeYAxisConfig(values: number[]) {
    const filtered = values.filter(v => v != null && typeof v === 'number')
    if (filtered.length === 0) return {}

    const min = Math.min(...filtered)
    const max = Math.max(...filtered)

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

// Study Tracks Configuration
const TRACKS = {
    SAYISAL: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'],
    ESIT_AGIRLIK: ['Matematik', 'Edebiyat', 'Tarih-1', 'Coğrafya-1'],
    SOZEL: ['Edebiyat', 'Tarih-1', 'Coğrafya-1', 'Tarih-2', 'Coğrafya-2', 'Felsefe', 'Din Kültürü'],
    ALL: [] as string[]
};

const CustomSubjectTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div
                className="border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-4 min-w-[200px] z-50"
                style={{
                    backgroundColor: 'var(--background)',
                    opacity: 1,
                    backdropFilter: 'none'
                }}
            >
                <div className="bg-white dark:bg-slate-950 absolute inset-0 -z-10 rounded-xl" />
                <p className="font-semibold mb-3 pb-2 border-b border-border/50 text-foreground relative">
                    {label}
                </p>
                <div className="space-y-2">
                    {payload.map((entry: any) => {
                        const num = typeof entry.value === 'number' ? entry.value : Number.parseFloat(String(entry.value ?? '0'))
                        const formattedValue = Number.isNaN(num) ? '-' : num.toFixed(2)
                        return (
                            <div key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill || entry.color }} />
                                    <span className="text-muted-foreground">{entry.name}:</span>
                                </div>
                                <span className="font-bold font-mono text-foreground">{formattedValue}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
    return null
}

export function ExamDetailCharts({
    scores,
    examType,
    totalNet,
    classSubjectAverages,
    classTotalAvg,
    schoolSubjectAverages,
    schoolTotalAvg,
}: ExamDetailChartsProps) {
    const [mainModalOpen, setMainModalOpen] = useState(false)
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
    const [totalModalOpen, setTotalModalOpen] = useState(false)

    // UI States
    const [selectedTrack, setSelectedTrack] = useState<string>('ALL')
    const [visibleSeries, setVisibleSeries] = useState({
        student: true,
        class: true,
        school: true
    })

    // Parse scores using the robust utility
    const parsedScores = flattenExamScores(scores, examType)

    // Ders bazlı karşılaştırma verileri
    const allSubjectData = Object.entries(parsedScores).map(([subject, net]) => {
        const studentNet = typeof net === 'number' ? net : 0
        return {
            subject,
            student_net: studentNet,
            class_net: classSubjectAverages[subject] ?? 0,
            school_net: schoolSubjectAverages[subject] ?? 0,
        }
    })

    // Filter based on Selected Track (for AYT)
    const subjectData = allSubjectData.filter(item => {
        if (examType === 'TYT' || selectedTrack === 'ALL') return true

        const allowed = TRACKS[selectedTrack as keyof typeof TRACKS] || []
        return allowed.some(s => s.toLowerCase() === item.subject.toLowerCase())
    })

    // Toplam net karşılaştırma
    const totalData = [
        {
            subject: 'Toplam Net',
            student_net: totalNet ?? 0,
            class_net: classTotalAvg,
            school_net: schoolTotalAvg,
        }
    ]

    // Compute Y axis configs for each chart type
    const subjectYAxis = computeYAxisConfig(
        subjectData.flatMap(d => [d.student_net, d.class_net, d.school_net])
    )
    const totalYAxis = computeYAxisConfig(
        [totalNet ?? 0, classTotalAvg, schoolTotalAvg]
    )
    const hasNegativeSubject = !!subjectYAxis.domain
    const hasNegativeTotal = !!totalYAxis.domain

    if (subjectData.length === 0) {
        return (
            <div className="p-6 rounded-xl border bg-muted/30 border-dashed text-center">
                <p className="text-sm text-muted-foreground">Ders bazlı veri bulunamadı</p>
            </div>
        )
    }

    const expandedItem = subjectData.find(s => s.subject === expandedSubject)

    return (
        <>
            <div className="space-y-6">
                {/* Ders bazlı ana grafik */}
                <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                    <div className="p-6 border-b bg-muted/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">Ders Bazlı Karşılaştırma</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Her ders için netinizi sınıf ve okul ortalamasıyla karşılaştırın
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Track Selector for AYT */}
                            {examType === 'AYT' && (
                                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="Alan Seç" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tüm Dersler</SelectItem>
                                        <SelectItem value="SAYISAL">Sayısal</SelectItem>
                                        <SelectItem value="ESIT_AGIRLIK">Eşit Ağırlık</SelectItem>
                                        <SelectItem value="SOZEL">Sözel</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Visibility Toggle */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 gap-2">
                                        <Eye className="w-4 h-4" />
                                        <span className="hidden sm:inline">Görünüm</span>
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
                                                    onCheckedChange={(c) => setVisibleSeries(prev => ({ ...prev, student: !!c }))}
                                                />
                                                <label htmlFor="show-student" className="text-sm cursor-pointer">Benim Netim</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="show-class"
                                                    checked={visibleSeries.class}
                                                    onCheckedChange={(c) => setVisibleSeries(prev => ({ ...prev, class: !!c }))}
                                                />
                                                <label htmlFor="show-class" className="text-sm cursor-pointer">Sınıf Ort.</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="show-school"
                                                    checked={visibleSeries.school}
                                                    onCheckedChange={(c) => setVisibleSeries(prev => ({ ...prev, school: !!c }))}
                                                />
                                                <label htmlFor="show-school" className="text-sm cursor-pointer">Okul Ort.</label>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="p-6">
                        <ExpandableChartWrapper onClick={() => setMainModalOpen(true)}>
                            <div className="w-full h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="subject" tick={{ fontSize: 12 }} axisLine={!hasNegativeSubject} tickLine={!hasNegativeSubject} />
                                        <YAxis tick={{ fontSize: 12 }} {...(subjectYAxis.domain ? { domain: subjectYAxis.domain } : {})} {...(subjectYAxis.ticks ? { ticks: subjectYAxis.ticks } : {})} />
                                        {hasNegativeSubject && <ReferenceLine y={0} stroke="#999" strokeWidth={1.5} />}
                                        <Tooltip content={<CustomSubjectTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Legend
                                            verticalAlign="top" align="right" iconType="circle"
                                            wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
                                        />
                                        {visibleSeries.student && <Bar name="Benim Netim" dataKey="student_net" fill={COLORS.student} radius={[6, 6, 0, 0]} barSize={32} />}
                                        {visibleSeries.class && <Bar name="Sınıf Ortalaması" dataKey="class_net" fill={COLORS.class} radius={[6, 6, 0, 0]} barSize={32} />}
                                        {visibleSeries.school && <Bar name="Okul Ortalaması" dataKey="school_net" fill={COLORS.school} radius={[6, 6, 0, 0]} barSize={32} />}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ExpandableChartWrapper>
                    </div>
                </div>

                {/* Her ders için ayrı küçük grafik kartları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectData.map((item) => {
                        const itemYAxis = computeYAxisConfig([item.student_net, item.class_net, item.school_net])
                        const hasNeg = !!itemYAxis.domain
                        return (
                            <div key={item.subject} className="border rounded-xl bg-card p-5 shadow-sm">
                                <h3 className="text-base font-semibold mb-4">{item.subject}</h3>
                                <ExpandableChartWrapper onClick={() => setExpandedSubject(item.subject)}>
                                    <div className="w-full h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={[
                                                    { name: 'Ben', value: item.student_net, fill: COLORS.student },
                                                    { name: 'Sınıf', value: item.class_net, fill: COLORS.class },
                                                    { name: 'Okul', value: item.school_net, fill: COLORS.school },
                                                ]}
                                                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={!hasNeg} tickLine={!hasNeg} />
                                                <YAxis tick={{ fontSize: 11 }} {...(itemYAxis.domain ? { domain: itemYAxis.domain } : {})} {...(itemYAxis.ticks ? { ticks: itemYAxis.ticks } : {})} />
                                                {hasNeg && <ReferenceLine y={0} stroke="#999" strokeWidth={1.5} />}
                                                <Tooltip content={<CustomSubjectTooltip />} cursor={{ fill: 'transparent' }} />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                                    {[
                                                        { key: 'student', color: COLORS.student },
                                                        { key: 'class', color: COLORS.class },
                                                        { key: 'school', color: COLORS.school }
                                                    ].map((s) => (
                                                        // Only render if visible, effectively hiding/showing bars
                                                        <rect key={s.key} fill={s.color} className={visibleSeries[s.key as keyof typeof visibleSeries] ? 'opacity-100' : 'opacity-0'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ExpandableChartWrapper>
                                <div className="flex items-center justify-between mt-3 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.student }} />
                                        <span className="text-muted-foreground">Sen: <span className="font-semibold text-foreground">{item.student_net}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.class }} />
                                        <span className="text-muted-foreground">Sınıf: <span className="font-semibold text-foreground">{item.class_net}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.school }} />
                                        <span className="text-muted-foreground">Okul: <span className="font-semibold text-foreground">{item.school_net}</span></span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Toplam Net Karşılaştırma */}
                <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                    <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                        <h2 className="text-xl font-semibold">Toplam Net Karşılaştırması</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Toplam netinizi sınıf ve okul ortalamasıyla kıyaslayın
                        </p>
                    </div>
                    <div className="p-6">
                        <ExpandableChartWrapper onClick={() => setTotalModalOpen(true)}>
                            <div className="w-full h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={totalData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="subject" tick={{ fontSize: 12 }} axisLine={!hasNegativeTotal} tickLine={!hasNegativeTotal} />
                                        <YAxis tick={{ fontSize: 12 }} {...(totalYAxis.domain ? { domain: totalYAxis.domain } : {})} {...(totalYAxis.ticks ? { ticks: totalYAxis.ticks } : {})} />
                                        {hasNegativeTotal && <ReferenceLine y={0} stroke="#999" strokeWidth={1.5} />}
                                        <Tooltip content={<CustomSubjectTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Legend
                                            verticalAlign="top" align="right" iconType="circle"
                                            wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
                                        />
                                        <Bar name="Benim Netim" dataKey="student_net" fill={COLORS.student} radius={[6, 6, 0, 0]} barSize={48} />
                                        <Bar name="Sınıf Ortalaması" dataKey="class_net" fill={COLORS.class} radius={[6, 6, 0, 0]} barSize={48} />
                                        <Bar name="Okul Ortalaması" dataKey="school_net" fill={COLORS.school} radius={[6, 6, 0, 0]} barSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ExpandableChartWrapper>

                        {/* Sayısal karşılaştırma kartları */}
                        <div className="grid grid-cols-3 gap-3 mt-6">
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-center">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Benim Netim</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalNet ?? '-'}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Sınıf Ortalaması</p>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{classTotalAvg}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Okul Ortalaması</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{schoolTotalAvg}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ana grafik modalı */}
            <ChartModal
                isOpen={mainModalOpen}
                onClose={() => setMainModalOpen(false)}
                title="Ders Bazlı Karşılaştırma"
                subtitle="Her ders için netinizi sınıf ve okul ortalamasıyla karşılaştırın"
            >
                <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="subject" tick={{ fontSize: 14 }} axisLine={!hasNegativeSubject} tickLine={!hasNegativeSubject} />
                            <YAxis tick={{ fontSize: 14 }} {...(subjectYAxis.domain ? { domain: subjectYAxis.domain } : {})} {...(subjectYAxis.ticks ? { ticks: subjectYAxis.ticks } : {})} />
                            {hasNegativeSubject && <ReferenceLine y={0} stroke="#999" strokeWidth={1.5} />}
                            <Tooltip content={<CustomSubjectTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend
                                verticalAlign="top" align="right" iconType="circle"
                                wrapperStyle={{ fontSize: '14px', paddingBottom: '16px' }}
                            />
                            {visibleSeries.student && <Bar name="Benim Netim" dataKey="student_net" fill={COLORS.student} radius={[8, 8, 0, 0]} barSize={48} />}
                            {visibleSeries.class && <Bar name="Sınıf Ortalaması" dataKey="class_net" fill={COLORS.class} radius={[8, 8, 0, 0]} barSize={48} />}
                            {visibleSeries.school && <Bar name="Okul Ortalaması" dataKey="school_net" fill={COLORS.school} radius={[8, 8, 0, 0]} barSize={48} />}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartModal >

            {/* Ders bazlı detay modalı */}
            {
                expandedItem && (
                    <ChartModal
                        isOpen={!!expandedSubject}
                        onClose={() => setExpandedSubject(null)}
                        title={expandedItem.subject}
                        subtitle="Net karşılaştırması"
                    >
                        <div className="w-full h-full flex flex-col">
                            <div className="flex items-center justify-center gap-8 mb-4 shrink-0">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.student }} />
                                    <span>Sen: <strong>{expandedItem.student_net}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.class }} />
                                    <span>Sınıf: <strong>{expandedItem.class_net}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.school }} />
                                    <span>Okul: <strong>{expandedItem.school_net}</strong></span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    {(() => {
                                        const expandedYAxis = computeYAxisConfig([expandedItem.student_net, expandedItem.class_net, expandedItem.school_net])
                                        const hasNeg = !!expandedYAxis.domain
                                        return (
                                            <BarChart
                                                data={[
                                                    { name: 'Ben', value: expandedItem.student_net, fill: COLORS.student },
                                                    { name: 'Sınıf', value: expandedItem.class_net, fill: COLORS.class },
                                                    { name: 'Okul', value: expandedItem.school_net, fill: COLORS.school },
                                                ]}
                                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                <XAxis dataKey="name" tick={{ fontSize: 14 }} axisLine={!hasNeg} tickLine={!hasNeg} />
                                                <YAxis tick={{ fontSize: 14 }} {...(expandedYAxis.domain ? { domain: expandedYAxis.domain } : {})} {...(expandedYAxis.ticks ? { ticks: expandedYAxis.ticks } : {})} />
                                                {hasNeg && <ReferenceLine y={0} stroke="#999" strokeWidth={1.5} />}
                                                <Tooltip content={<CustomSubjectTooltip />} cursor={{ fill: 'transparent' }} />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                                                    {[COLORS.student, COLORS.class, COLORS.school].map((color) => (
                                                        <rect key={color} fill={color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        )
                                    })()}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </ChartModal>
                )
            }

            {/* Toplam net modalı */}
            <ChartModal
                isOpen={totalModalOpen}
                onClose={() => setTotalModalOpen(false)}
                title="Toplam Net Karşılaştırması"
                subtitle="Toplam netinizi sınıf ve okul ortalamasıyla kıyaslayın"
            >
                <div className="w-full h-full flex flex-col">
                    <div className="flex items-center justify-center gap-8 mb-6 shrink-0">
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-center min-w-[140px]">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Benim Netim</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalNet ?? '-'}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center min-w-[140px]">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Sınıf Ortalaması</p>
                            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{classTotalAvg}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center min-w-[140px]">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Okul Ortalaması</p>
                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{schoolTotalAvg}</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={totalData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="subject" tick={{ fontSize: 14 }} axisLine={!hasNegativeTotal} tickLine={!hasNegativeTotal} />
                                <YAxis tick={{ fontSize: 14 }} {...(totalYAxis.domain ? { domain: totalYAxis.domain } : {})} {...(totalYAxis.ticks ? { ticks: totalYAxis.ticks } : {})} />
                                {hasNegativeTotal && <ReferenceLine y={0} stroke="#999" strokeWidth={1.5} />}
                                <Tooltip content={<CustomSubjectTooltip />} cursor={{ fill: 'transparent' }} />
                                <Legend
                                    verticalAlign="top" align="right" iconType="circle"
                                    wrapperStyle={{ fontSize: '14px', paddingBottom: '16px' }}
                                />
                                <Bar name="Benim Netim" dataKey="student_net" fill={COLORS.student} radius={[8, 8, 0, 0]} barSize={80} />
                                <Bar name="Sınıf Ortalaması" dataKey="class_net" fill={COLORS.class} radius={[8, 8, 0, 0]} barSize={80} />
                                <Bar name="Okul Ortalaması" dataKey="school_net" fill={COLORS.school} radius={[8, 8, 0, 0]} barSize={80} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </ChartModal>
        </>
    )
}
