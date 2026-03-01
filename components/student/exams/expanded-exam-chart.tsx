'use client'

import React, { useState, useMemo } from 'react'
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
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn, formatXAxisTick } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ChartToggle } from './chart-toggle'
import { CustomTooltip } from './custom-tooltip'

// --- Types ---

interface ChartDataPoint {
    name: string
    label: string
    fullDate: string
    student_net: number | null
    class_net: number | null
    school_net: number | null
    originalDate: Date | null // Used for filtering
    [key: string]: any
}

interface ExpandedExamChartProps {
    data: ChartDataPoint[]
}

type FilterType = 'last5' | 'last10' | 'last20' | 'all' | 'custom'

// --- Constants & Helpers ---

const COLORS = {
    student: '#3b82f6',
    class: '#f59e0b',
    school: '#10b981',
}

// CustomTooltip removed from here, imported from ./custom-tooltip

// --- Component ---

export function ExpandedExamChart({ data }: Readonly<ExpandedExamChartProps>) { // NOSONAR
    const [isBarChart, setIsBarChart] = useState(false)
    const [filter, setFilter] = useState<FilterType>('all')
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

    // Filter Logic
    const filteredData = useMemo(() => {
        // 1. Sort by date descending (newest first) for easier slicing
        let processed = [...data].sort((a, b) => {
            if (!a.originalDate) return 1
            if (!b.originalDate) return -1

            const dateDiff = b.originalDate.getTime() - a.originalDate.getTime()
            if (dateDiff !== 0) return dateDiff

            // Secondary sort: created_at (newest first for slicing)
            const createdA = a.created_at ? new Date(a.created_at).getTime() : 0
            const createdB = b.created_at ? new Date(b.created_at).getTime() : 0
            return createdB - createdA
        })

        // 2. Apply Custom Date Filter
        if (filter === 'custom' && dateRange?.from) {
            processed = processed.filter(item => {
                if (!item.originalDate) return false
                // Set to start/end of days for comparison
                const d = new Date(item.originalDate)
                d.setHours(0, 0, 0, 0)

                const f = new Date(dateRange.from!) // NOSONAR
                f.setHours(0, 0, 0, 0)

                const t = new Date(dateRange.to || dateRange.from!)
                t.setHours(23, 59, 59, 999)

                return d >= f && d <= t
            })
        }
        // 3. Apply Quick Filters (Slice)
        else if (filter === 'last5') {
            processed = processed.slice(0, 5)
        } else if (filter === 'last10') {
            processed = processed.slice(0, 10)
        } else if (filter === 'last20') {
            processed = processed.slice(0, 20)
        }
        // 'all' does nothing

        // 4. Sort back to ascending (oldest -> newest) for Chart
        return processed.sort((a, b) => {
            if (!a.originalDate) return 1
            if (!b.originalDate) return -1
            const dateDiff = a.originalDate.getTime() - b.originalDate.getTime()
            if (dateDiff !== 0) return dateDiff

            // Secondary sort: created_at (oldest first for chart)
            const createdA = a.created_at ? new Date(a.created_at).getTime() : 0
            const createdB = b.created_at ? new Date(b.created_at).getTime() : 0
            return createdA - createdB
        })
    }, [data, filter, dateRange])

    // Handlers
    const handleFilterChange = (newFilter: FilterType) => {
        setFilter(newFilter)
        if (newFilter !== 'custom') {
            setDateRange(undefined)
        }
    }

    const handleDateSelect = (range: DateRange | undefined) => {
        setDateRange(range)
        if (range) {
            setFilter('custom')
        }
    }

    // Derived state for DatePicker button text
    let dateButtonText: React.ReactNode;
    if (!dateRange?.from) {
        dateButtonText = <span>Tarih Seç</span>;
    } else if (dateRange.to) {
        dateButtonText = <>{format(dateRange.from, "d MMM", { locale: tr })} - {format(dateRange.to, "d MMM", { locale: tr })}</>;
    } else {
        dateButtonText = format(dateRange.from, "d MMM", { locale: tr });
    }


    // Chart Rendering Helper (Internal)
    const renderChartContent = () => {
        const CommonProps = {
            data: filteredData,
            margin: { top: 10, right: 10, left: -10, bottom: 60 }
        }

        const CommonComponents = (
            <>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" height={70} angle={-20} textAnchor="end" tickFormatter={formatXAxisTick} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    isAnimationActive={false}
                    allowEscapeViewBox={{ x: false, y: false }}
                />
                <Legend
                    verticalAlign="top" align="right" iconType="circle"
                    wrapperStyle={{ fontSize: '14px', paddingBottom: '16px' }}
                />
                <Brush
                    dataKey="label"
                    height={30}
                    stroke="hsl(var(--primary))"
                    travellerWidth={10}
                    fill="hsl(var(--muted))"
                />
            </>
        )

        if (isBarChart) {
            return (
                <BarChart {...CommonProps}>
                    {CommonComponents}
                    <Bar name="Benim Netim" dataKey="student_net" fill={COLORS.student} radius={[6, 6, 0, 0]} barSize={32} />
                    <Bar name="Sınıf Ortalaması" dataKey="class_net" fill={COLORS.class} radius={[6, 6, 0, 0]} barSize={32} />
                    <Bar name="Okul Ortalaması" dataKey="school_net" fill={COLORS.school} radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
            )
        }
        return (
            <LineChart {...CommonProps}>
                {CommonComponents}
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

    return (
        <div className="flex flex-col h-full w-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-1">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                    {/* Quick Filters */}
                    <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                        {[
                            { id: 'last5', label: 'Son 5' },
                            { id: 'last10', label: 'Son 10' },
                            { id: 'last20', label: 'Son 20' },
                            { id: 'all', label: 'Tümü' },
                        ].map((btn) => (
                            <Button
                                key={btn.id}
                                variant={filter === btn.id ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleFilterChange(btn.id as FilterType)}
                                className={cn(
                                    "h-7 px-3 text-xs font-medium rounded-md transition-all",
                                    filter === btn.id && "shadow-sm"
                                )}
                            >
                                {btn.label}
                            </Button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={filter === 'custom' ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                    "h-9 justify-start text-left font-normal px-3",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateButtonText}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={handleDateSelect}
                                numberOfMonths={2}
                                locale={tr}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <ChartToggle isBarChart={isBarChart} onChange={setIsBarChart} />
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChartContent()}
                </ResponsiveContainer>
            </div>
        </div>
    )
}
