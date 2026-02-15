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
} from 'recharts'
import { ChartModal, ExpandableChartWrapper } from './chart-modal'

interface ExamDetailChartsProps {
    scores: Record<string, any>
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

export function ExamDetailCharts({
    scores,
    totalNet,
    classSubjectAverages,
    classTotalAvg,
    schoolSubjectAverages,
    schoolTotalAvg,
}: ExamDetailChartsProps) {
    const [mainModalOpen, setMainModalOpen] = useState(false)
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
    const [totalModalOpen, setTotalModalOpen] = useState(false)

    // Parse scores
    let parsedScores = scores
    if (typeof parsedScores === 'string') {
        try { parsedScores = JSON.parse(parsedScores) } catch { parsedScores = {} }
    }
    if (!parsedScores || typeof parsedScores !== 'object') parsedScores = {}

    // Ders bazlı karşılaştırma verileri
    const subjectData = Object.entries(parsedScores).map(([subject, data]: [string, any]) => {
        const studentNet = typeof data === 'number' ? data : (data?.net ?? 0)
        return {
            subject,
            'Benim Netim': studentNet,
            'Sınıf Ortalaması': classSubjectAverages[subject] ?? 0,
            'Okul Ortalaması': schoolSubjectAverages[subject] ?? 0,
        }
    })

    // Toplam net karşılaştırma
    const totalData = [
        {
            subject: 'Toplam Net',
            'Benim Netim': totalNet ?? 0,
            'Sınıf Ortalaması': classTotalAvg,
            'Okul Ortalaması': schoolTotalAvg,
        }
    ]

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
                    <div className="p-6 border-b bg-muted/50">
                        <h2 className="text-xl font-semibold">Ders Bazlı Karşılaştırma</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Her ders için netinizi sınıf ve okul ortalamasıyla karşılaştırın
                        </p>
                    </div>
                    <div className="p-6">
                        <ExpandableChartWrapper onClick={() => setMainModalOpen(true)}>
                            <div className="w-full h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                                        <Legend
                                            verticalAlign="top" align="right" iconType="circle"
                                            wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
                                        />
                                        <Bar dataKey="Benim Netim" fill={COLORS.student} radius={[6, 6, 0, 0]} barSize={32} />
                                        <Bar dataKey="Sınıf Ortalaması" fill={COLORS.class} radius={[6, 6, 0, 0]} barSize={32} />
                                        <Bar dataKey="Okul Ortalaması" fill={COLORS.school} radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ExpandableChartWrapper>
                    </div>
                </div>

                {/* Her ders için ayrı küçük grafik kartları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectData.map((item) => (
                        <div key={item.subject} className="border rounded-xl bg-card p-5 shadow-sm">
                            <h3 className="text-base font-semibold mb-4">{item.subject}</h3>
                            <ExpandableChartWrapper onClick={() => setExpandedSubject(item.subject)}>
                                <div className="w-full h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[
                                                { name: 'Ben', value: item['Benim Netim'], fill: COLORS.student },
                                                { name: 'Sınıf', value: item['Sınıf Ortalaması'], fill: COLORS.class },
                                                { name: 'Okul', value: item['Okul Ortalaması'], fill: COLORS.school },
                                            ]}
                                            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                                {[COLORS.student, COLORS.class, COLORS.school].map((color, i) => (
                                                    <rect key={i} fill={color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ExpandableChartWrapper>
                            <div className="flex items-center justify-between mt-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.student }} />
                                    <span className="text-muted-foreground">Sen: <span className="font-semibold text-foreground">{item['Benim Netim']}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.class }} />
                                    <span className="text-muted-foreground">Sınıf: <span className="font-semibold text-foreground">{item['Sınıf Ortalaması']}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.school }} />
                                    <span className="text-muted-foreground">Okul: <span className="font-semibold text-foreground">{item['Okul Ortalaması']}</span></span>
                                </div>
                            </div>
                        </div>
                    ))}
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
                                        <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                                        <Legend
                                            verticalAlign="top" align="right" iconType="circle"
                                            wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
                                        />
                                        <Bar dataKey="Benim Netim" fill={COLORS.student} radius={[6, 6, 0, 0]} barSize={48} />
                                        <Bar dataKey="Sınıf Ortalaması" fill={COLORS.class} radius={[6, 6, 0, 0]} barSize={48} />
                                        <Bar dataKey="Okul Ortalaması" fill={COLORS.school} radius={[6, 6, 0, 0]} barSize={48} />
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
                            <XAxis dataKey="subject" tick={{ fontSize: 14 }} />
                            <YAxis tick={{ fontSize: 14 }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                            <Legend
                                verticalAlign="top" align="right" iconType="circle"
                                wrapperStyle={{ fontSize: '14px', paddingBottom: '16px' }}
                            />
                            <Bar dataKey="Benim Netim" fill={COLORS.student} radius={[8, 8, 0, 0]} barSize={48} />
                            <Bar dataKey="Sınıf Ortalaması" fill={COLORS.class} radius={[8, 8, 0, 0]} barSize={48} />
                            <Bar dataKey="Okul Ortalaması" fill={COLORS.school} radius={[8, 8, 0, 0]} barSize={48} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartModal>

            {/* Ders bazlı detay modalı */}
            {expandedItem && (
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
                                <span>Sen: <strong>{expandedItem['Benim Netim']}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.class }} />
                                <span>Sınıf: <strong>{expandedItem['Sınıf Ortalaması']}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.school }} />
                                <span>Okul: <strong>{expandedItem['Okul Ortalaması']}</strong></span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: 'Ben', value: expandedItem['Benim Netim'], fill: COLORS.student },
                                        { name: 'Sınıf', value: expandedItem['Sınıf Ortalaması'], fill: COLORS.class },
                                        { name: 'Okul', value: expandedItem['Okul Ortalaması'], fill: COLORS.school },
                                    ]}
                                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                                    <YAxis tick={{ fontSize: 14 }} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                                        {[COLORS.student, COLORS.class, COLORS.school].map((color, i) => (
                                            <rect key={i} fill={color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </ChartModal>
            )}

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
                                <XAxis dataKey="subject" tick={{ fontSize: 14 }} />
                                <YAxis tick={{ fontSize: 14 }} />
                                <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                                <Legend
                                    verticalAlign="top" align="right" iconType="circle"
                                    wrapperStyle={{ fontSize: '14px', paddingBottom: '16px' }}
                                />
                                <Bar dataKey="Benim Netim" fill={COLORS.student} radius={[8, 8, 0, 0]} barSize={80} />
                                <Bar dataKey="Sınıf Ortalaması" fill={COLORS.class} radius={[8, 8, 0, 0]} barSize={80} />
                                <Bar dataKey="Okul Ortalaması" fill={COLORS.school} radius={[8, 8, 0, 0]} barSize={80} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </ChartModal>
        </>
    )
}
