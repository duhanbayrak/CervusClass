'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Schedule } from '@/types/database' // Or from supabase types

// Extended type with relations
export type ScheduleEvent = Schedule & {
    courses?: { name: string, code?: string }
    classes?: { name: string }
    profiles?: { full_name: string }
    room_name?: string
}

interface WeeklySchedulerProps {
    events: ScheduleEvent[]
    role: 'admin' | 'teacher' | 'student'
    onDelete?: (id: string) => void
    onEventClick?: (event: ScheduleEvent) => void
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 08:00 - 21:00
const HOUR_HEIGHT = 100 // Increased from 60px

export function WeeklyScheduler({ events, role, onDelete, onEventClick }: WeeklySchedulerProps) {

    const getEventStyle = (event: ScheduleEvent) => {
        // Generate a consistent color based on course name
        const string = event.courses?.name || 'default'
        let hash = 0
        for (let i = 0; i < string.length; i++) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash)
        }
        const hue = Math.abs(hash % 360)
        return {
            backgroundColor: `hsl(${hue}, 70%, 90%)`,
            borderColor: `hsl(${hue}, 70%, 50%)`,
            color: `hsl(${hue}, 90%, 20%)`
        }
    }

    const getPosition = (start: string, end: string) => {
        // start: "09:30:00"
        const [h1, m1] = start.split(':').map(Number)
        const [h2, m2] = end.split(':').map(Number)

        // Grid starts at 08:00. Each hour is HOUR_HEIGHT px.
        const startOffset = (h1 - 8) * HOUR_HEIGHT + (m1 / 60) * HOUR_HEIGHT
        const duration = (((h2 * 60 + m2) - (h1 * 60 + m1)) / 60) * HOUR_HEIGHT

        return { top: startOffset, height: duration }
    }

    return (
        <div className="flex flex-col h-full overflow-auto bg-background rounded-lg border">
            {/* Header (Days) */}
            <div className="grid grid-cols-8 sticky top-0 bg-background z-10 border-b min-w-[800px]">
                <div className="p-4 border-r font-medium text-center text-muted-foreground w-20">Saat</div>
                {DAYS.map((day, i) => (
                    <div key={day} className="p-4 border-r last:border-r-0 font-medium text-center">
                        {day}
                    </div>
                ))}
            </div>

            {/* Body (Time slots) */}
            <div className="relative grid grid-cols-8 min-w-[800px]" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                {/* Time Column */}
                <div className="border-r bg-muted/20">
                    {HOURS.map(hour => (
                        <div key={hour} className="border-b text-xs text-muted-foreground p-1 text-center relative" style={{ height: HOUR_HEIGHT }}>
                            <span className="absolute -top-2 left-0 right-0 bg-background/50">{hour.toString().padStart(2, '0')}:00</span>
                        </div>
                    ))}
                </div>

                {/* Days Columns */}
                {DAYS.map((_, dayIndex) => {
                    const dayEvents = events.filter(e => e.day_of_week === dayIndex + 1);

                    // Calculate Layout
                    // 1. Sort
                    const sorted = [...dayEvents].sort((a, b) => a.start_time.localeCompare(b.start_time));

                    // 2. Clusters
                    const clusters: ScheduleEvent[][] = [];
                    let currentCluster: ScheduleEvent[] = [];
                    let clusterEnd = "00:00";

                    for (const event of sorted) {
                        if (currentCluster.length === 0) {
                            currentCluster.push(event);
                            clusterEnd = event.end_time;
                        } else {
                            if (event.start_time < clusterEnd) {
                                currentCluster.push(event);
                                if (event.end_time > clusterEnd) clusterEnd = event.end_time;
                            } else {
                                clusters.push(currentCluster);
                                currentCluster = [event];
                                clusterEnd = event.end_time;
                            }
                        }
                    }
                    if (currentCluster.length > 0) clusters.push(currentCluster);

                    // 3. Columns
                    const positions = new Map<string, { width: number, left: number }>();
                    for (const cluster of clusters) {
                        const cols: ScheduleEvent[][] = [];
                        for (const event of cluster) {
                            let placed = false;
                            for (let i = 0; i < cols.length; i++) {
                                const last = cols[i][cols[i].length - 1];
                                if (event.start_time >= last.end_time) {
                                    cols[i].push(event);
                                    positions.set(event.id, { width: 0, left: i });
                                    placed = true;
                                    break;
                                }
                            }
                            if (!placed) {
                                cols.push([event]);
                                positions.set(event.id, { width: 0, left: cols.length - 1 });
                            }
                        }

                        const count = cols.length;
                        const widthPerCol = 100 / count;

                        for (const event of cluster) {
                            const p = positions.get(event.id)!;
                            positions.set(event.id, { width: widthPerCol, left: p.left * widthPerCol });
                        }
                    }

                    return (
                        <div key={dayIndex} className="relative border-r last:border-r-0 border-b-0 h-full">
                            {/* Grid lines */}
                            {HOURS.map(hour => (
                                <div key={hour} className="border-b border-dashed border-muted/50" style={{ height: HOUR_HEIGHT }} />
                            ))}

                            {/* Events */}
                            {dayEvents.map(event => {
                                const { top, height } = getPosition(event.start_time, event.end_time)
                                const layout = positions.get(event.id) || { width: 100, left: 0 };

                                return (
                                    <div
                                        key={event.id}
                                        className={cn(
                                            "absolute rounded px-2 py-1 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden group z-10",
                                            "flex flex-col justify-start"
                                        )}
                                        style={{
                                            top: `${top}px`,
                                            height: `${height}px`,
                                            left: `${layout.left}%`,
                                            width: `${layout.width}%`,
                                            ...getEventStyle(event)
                                        }}
                                        onClick={() => {
                                            if (role === 'admin') {
                                                if (onEventClick) onEventClick(event);
                                                else if (onDelete) onDelete(event.id);
                                            }
                                        }}
                                    >
                                        <div className="font-bold whitespace-normal leading-tight">{event.courses?.name}</div>
                                        <div className="opacity-90 whitespace-normal leading-tight text-[11px] mt-0.5">
                                            {role === 'student' ? event.profiles?.full_name : event.classes?.name}
                                        </div>
                                        <div className="text-[10px] opacity-75 mt-auto pb-0.5 font-mono">
                                            {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                                        </div>
                                        {event.room_name && <div className="absolute top-1 right-1 text-[9px] border bg-white/50 px-1 rounded shadow-sm">{event.room_name}</div>}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
