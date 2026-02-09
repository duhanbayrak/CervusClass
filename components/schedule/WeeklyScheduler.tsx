'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Schedule } from '@/types/database'
import { Loader2, CalendarPlus, User, Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { CreateAvailabilityDialog } from './create-availability-dialog'
import { Button } from '../ui/button'

// Extended type with relations
export type ScheduleEvent = Schedule & {
    courses?: { name: string, code?: string }
    classes?: { name: string }
    profiles?: { full_name: string }
    room_name?: string
}

// Minimal type for Study Sessions to mix in
export interface StudySessionEvent {
    id: string
    scheduled_at: string // ISO string
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'no_show' | 'available'
    teacher_id: string
    student_id?: string | null
    topic?: string | null
    profiles?: { full_name: string } // Student info
}

interface WeeklySchedulerProps {
    events: ScheduleEvent[]
    studySessions?: StudySessionEvent[]
    role: 'admin' | 'teacher' | 'student'
    onDelete?: (id: string) => void
    onEventClick?: (event: ScheduleEvent | StudySessionEvent) => void
    onSlotClick?: (date: Date) => void // For empty slots
    currentUserId?: string
}

// Helper to get Monday of the current week
const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
}
// ... (Weekly_Scheduler component start) ...

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 08:00 - 21:00
const HOUR_HEIGHT = 100

export function WeeklyScheduler({ events, studySessions = [], role, onDelete, onEventClick, onSlotClick, currentUserId }: WeeklySchedulerProps) {
    // State for navigation
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return getMonday(today);
    });

    const [createModal, setCreateModal] = useState<{ open: boolean, date: Date | null, startTime?: string }>({
        open: false,
        date: null
    });

    // Helper to determine classes (RESTORED)
    const getEventClasses = (event: ScheduleEvent | StudySessionEvent, isStudySession: boolean) => {
        if (isStudySession) {
            const s = event as StudySessionEvent;
            const isMySession = currentUserId && s.student_id === currentUserId;

            if (s.status === 'available') {
                return {
                    container: "bg-emerald-200 border-emerald-500 border-dashed",
                    title: "text-emerald-800",
                    subtitle: "text-emerald-800",
                    icon: "text-emerald-800"
                }
            } else if (isMySession) {
                return {
                    container: "bg-indigo-50 border-indigo-400 border-solid",
                    title: "text-indigo-900",
                    subtitle: "text-indigo-700",
                    icon: "text-indigo-600"
                }
            } else {
                if (role === 'teacher') {
                    if (s.status === 'pending') {
                        return {
                            container: "bg-amber-50 border-amber-400 border-solid",
                            title: "text-amber-900",
                            subtitle: "text-amber-700",
                            icon: "text-amber-600"
                        }
                    }
                    if (s.status === 'completed') {
                        return {
                            container: "bg-blue-100 border-blue-500 border-solid",
                            title: "text-blue-900",
                            subtitle: "text-blue-700",
                            icon: "text-blue-600"
                        }
                    }
                    if (s.status === 'no_show') {
                        return {
                            container: "bg-red-100 border-red-500 border-solid",
                            title: "text-red-900",
                            subtitle: "text-red-700",
                            icon: "text-red-600"
                        }
                    }
                    // Default typically means 'approved' (student booked)
                    return {
                        container: "bg-purple-100 border-purple-500 border-solid",
                        title: "text-purple-900",
                        subtitle: "text-purple-700",
                        icon: "text-purple-600"
                    }
                }
                return {
                    container: "bg-slate-100 border-slate-300 border-solid",
                    title: "text-slate-600",
                    subtitle: "text-slate-500",
                    icon: "text-slate-400"
                }
            }
        }

        // Regular Schedule Events (Classes)
        return {
            container: "bg-zinc-100 border-zinc-300 border-solid",
            title: "text-zinc-800",
            subtitle: "text-zinc-600",
            icon: "text-zinc-500"
        }
    }

    const getPosition = (start: string, end: string) => {
        const [h1, m1] = start.split(':').map(Number)
        const [h2, m2] = end.split(':').map(Number)
        const startOffset = (h1 - 8) * HOUR_HEIGHT + (m1 / 60) * HOUR_HEIGHT
        const duration = (((h2 * 60 + m2) - (h1 * 60 + m1)) / 60) * HOUR_HEIGHT
        return { top: startOffset, height: duration }
    }

    const getStudySessionPosition = (scheduledAt: string) => {
        const date = new Date(scheduledAt);
        const h = date.getHours();
        const m = date.getMinutes();
        const startOffset = (h - 8) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
        const duration = 60 / 60 * HOUR_HEIGHT; // 1 hour fixed
        return { top: startOffset, height: duration }
    }

    // Drag to Scroll Logic (RESTORED)
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const isPointerDown = React.useRef(false);
    const startX = React.useRef(0);
    const startScrollLeft = React.useRef(0);
    const [isDragging, setIsDragging] = React.useState(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!scrollRef.current) return;
        if (e.pointerType === 'touch') return;

        isPointerDown.current = true;
        startX.current = e.pageX - scrollRef.current.offsetLeft;
        startScrollLeft.current = scrollRef.current.scrollLeft;
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isPointerDown.current = false;
        if (isDragging) {
            setIsDragging(false);
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch (err) { }
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPointerDown.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const dist = Math.abs(x - startX.current);
        if (!isDragging && dist > 5) {
            setIsDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
        }
        if (isDragging || dist > 5) {
            const walk = (x - startX.current) * 2;
            scrollRef.current.scrollLeft = startScrollLeft.current - walk;
        }
    };

    const handlePrevWeek = () => {
        setStartDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 7);
            return d;
        });
    }

    const handleNextWeek = () => {
        setStartDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + 7);
            return d;
        });
    }

    const handleToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setStartDate(getMonday(today));
    }

    // Generate dates based on startDate
    const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
    });

    const isSameDate = (d1: Date, stringDate: string) => {
        const d2 = new Date(stringDate);
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    }

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border overflow-hidden">
            {/* Navigation Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevWeek}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Önceki Hafta</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>
                        Bugün
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Sonraki Hafta</span>
                    </Button>
                    <span className="text-sm font-medium ml-2">
                        {startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {' '}
                        {dates[dates.length - 1].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Create Availability Dialog (Active Instance) */}
            {createModal.date && (
                <CreateAvailabilityDialog
                    open={createModal.open}
                    onOpenChange={(val) => setCreateModal(prev => ({ ...prev, open: val }))}
                    date={createModal.date}
                    initialStartTime={createModal.startTime}
                    key={createModal.date.toISOString() + createModal.startTime + createModal.open} // Force reset on change
                />
            )}

            {/* Scrollable Container */}
            <div
                className={cn(
                    "flex-1 overflow-auto relative select-none",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                ref={scrollRef}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
            >
                <div className="flex min-w-max">
                    {/* Time Column (Sticky) */}
                    <div className="sticky left-0 bg-background z-30 border-r border-b w-16 flex-none shrink-0">
                        <div className="h-14 border-b bg-background sticky top-0 z-40"></div> {/* Header Corner */}
                        {HOURS.map((hour, index) => (
                            <div key={hour} className="border-b text-xs text-muted-foreground relative bg-background" style={{ height: HOUR_HEIGHT }}>
                                <span className={cn(
                                    "absolute left-1 bg-background/80 px-1",
                                    index === 0 ? "top-1" : "-top-2"
                                )}>
                                    {hour.toString().padStart(2, '0')}:00
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Date Columns */}
                    {dates.map((date, i) => {
                        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
                        const daStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                        const dayNumber = date.getDay() || 7; // 1 (Mon) - 7 (Sun)

                        // Filter Standard Events (Recurring by weekday, valid from creation date)
                        const dayEvents = events.filter(e => {
                            if (e.day_of_week !== dayNumber) return false;

                            // Check if the current view date is on or after the event creation date
                            const eventCreated = new Date(e.created_at);
                            eventCreated.setHours(0, 0, 0, 0);

                            const currentViewDate = new Date(date);
                            currentViewDate.setHours(0, 0, 0, 0);

                            return currentViewDate >= eventCreated;
                        });

                        // Filter Study Sessions (Exact date)
                        const daySessions = studySessions.filter(s => isSameDate(date, s.scheduled_at));

                        return (
                            <div key={i} className="flex-none w-[200px] md:w-[180px] border-r border-b relative group/col">
                                {/* Header */}
                                <div className="h-14 sticky top-0 bg-background z-30 border-b flex flex-col items-center justify-center font-medium shadow-sm">
                                    <span className="text-sm text-muted-foreground">{dayName}</span>
                                    <span className="text-lg leading-none">{daStr}</span>
                                </div>

                                {/* Body */}
                                <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                                    {/* Grid Lines */}
                                    {HOURS.map(hour => (
                                        <div
                                            key={hour}
                                            className={cn(
                                                "border-b border-dashed border-muted/50 w-full absolute hover:bg-muted/10 transition-colors",
                                                role === 'teacher' ? "cursor-pointer group/cell" : ""
                                            )}
                                            style={{ top: (hour - 8) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                            onClick={(e) => {
                                                if (role !== 'teacher') return;
                                                // Prevent triggering if clicking existing event
                                                if (isDragging) return;

                                                setCreateModal({
                                                    open: true,
                                                    date: date,
                                                    startTime: `${String(hour).padStart(2, '0')}:00`
                                                })
                                            }}
                                        >
                                            {role === 'teacher' && (
                                                <div className="hidden group-hover/cell:flex absolute inset-0 items-center justify-center pointer-events-none">
                                                    <div className="bg-primary/10 text-primary rounded-full p-1">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Standard Events */}
                                    {dayEvents.map(event => {
                                        const { top, height } = getPosition(event.start_time, event.end_time)
                                        const classes = getEventClasses(event, false);
                                        const timeRange = `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`

                                        return (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    "absolute rounded px-2 py-1 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden z-20", // Changed to z-20 to be consistent with study sessions, behind header z-30
                                                    "flex flex-col justify-start",
                                                    classes.container
                                                )}
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    left: '2px',
                                                    right: '2px'
                                                }}
                                                onClick={() => onEventClick?.(event)}
                                            >
                                                <div className={cn("text-[10px] opacity-80 font-mono mb-0.5 leading-none", classes.subtitle)}>
                                                    {timeRange}
                                                </div>
                                                <div className="absolute top-1 right-1 text-[9px] font-bold opacity-60 uppercase tracking-tighter">Ders</div>
                                                <div className={cn("font-bold leading-tight", classes.title)}>{event.courses?.name}</div>
                                                <div className={cn("opacity-90 text-[10px]", classes.subtitle)}>{event.classes?.name}</div>
                                            </div>
                                        )
                                    })}

                                    {/* Study Sessions */}
                                    {daySessions.map(session => {
                                        const { top, height } = getStudySessionPosition(session.scheduled_at);
                                        const eventTime = new Date(session.scheduled_at);
                                        const endTime = new Date(eventTime.getTime() + 60 * 60 * 1000); // 1 hour fixed
                                        const timeRange = `${eventTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
                                        const classes = getEventClasses(session, true);

                                        return (
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    "absolute rounded px-2 py-1 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden z-20",
                                                    "flex flex-col justify-start",
                                                    classes.container
                                                )}
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    left: '4px',
                                                    right: '4px'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isDragging) return; // Prevent click if dragging
                                                    onEventClick?.(session);
                                                }}
                                            >
                                                <div className="absolute top-1 right-1 text-[9px] font-bold opacity-60 uppercase tracking-tighter">Etüt</div>

                                                <div className={cn("text-[10px] opacity-80 font-mono mb-0.5 leading-none", classes.subtitle)}>
                                                    {timeRange}
                                                </div>

                                                <div className={cn("text-xs font-bold leading-tight flex items-center gap-1 mt-1", classes.title)}>
                                                    {session.status === 'available' ? (
                                                        <><CalendarPlus className={cn("w-3.5 h-3.5", classes.icon)} /> Boş</>
                                                    ) : (
                                                        <>{session.topic || 'Dolu'}</>
                                                    )}
                                                </div>

                                                <div className={cn("text-[11px] opacity-90 truncate font-medium mt-0.5", classes.subtitle)}>
                                                    {session.status === 'available' ? '' :
                                                        (role === 'teacher' || (currentUserId && session.student_id === currentUserId)) ? (session.profiles?.full_name || 'Öğrenci') : ''}
                                                </div>

                                                {currentUserId && session.student_id === currentUserId && <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
