'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { } from '@/types/database'
import { CalendarPlus, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { CreateAvailabilityDialog } from './create-availability-dialog'
import { Button } from '../ui/button'

// Extended type with relations
import { HOURS, HOUR_HEIGHT, getPosition, getStudySessionPosition, getEventClasses } from '@/lib/utils/schedule-helpers'
import { ScheduleEvent, StudySessionEvent } from '@/types/schedule'

interface WeeklySchedulerProps {
    events: ScheduleEvent[]
    studySessions?: StudySessionEvent[]
    role: 'admin' | 'teacher' | 'student'
    onDelete?: (id: string) => void
    onEventClick?: (event: ScheduleEvent | StudySessionEvent) => void
    onSlotClick?: (date: Date) => void // For empty slots
    currentUserId?: string
}

export function WeeklyScheduler({ events, studySessions = [], role, onDelete, onEventClick, onSlotClick, currentUserId }: Readonly<WeeklySchedulerProps>) {



    // State for navigation — bugünden başla
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });

    const [createModal, setCreateModal] = useState<{ open: boolean, date: Date | null, startTime?: string }>({
        open: false,
        date: null
    });

    // Dialog kapandığında state'i temizle (key prop yerine)
    useEffect(() => {
        if (!createModal.open) {
            // Animasyon bitmesini bekleyip temizlemek daha şık olabilir ama şimdilik gerek yok
            // setCreateModal({ open: false, date: null }); 
            // Burada bir şey yapmaya gerek yok, açılırken set ediyoruz zaten.
        }
    }, [createModal.open]);


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
            } catch (err) { console.error("Ignored error:", err); }
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
        setStartDate(today);
    }

    // Generate dates based on startDate
    const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
    });

    // --- OPTIMIZATION START ---

    // 1. Group events by day of week (1-7)
    const eventsByDay = useMemo(() => {
        const map = new Map<number, ScheduleEvent[]>();
        events.forEach(e => {
            const day = e.day_of_week;
            if (!map.has(day)) map.set(day, []);
            map.get(day)!.push(e);
        });
        return map;
    }, [events]);

    // 2. Group sessions by date string (YYYY-MM-DD or similar unique key)
    // We use isSameDate logic, so let's pre-process keys to match dates logic
    const sessionsByDateKey = useMemo(() => {
        const map = new Map<string, StudySessionEvent[]>();
        studySessions.forEach(s => {
            const d = new Date(s.scheduled_at);
            // Key format: "YYYY-M-D" matching how we might compare
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(s);
        });
        return map;
    }, [studySessions]);

    // --- OPTIMIZATION END ---

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
                        {dates.at(-1)?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                // Key removed to prevent full re-mount, relying on date prop change or internal handling
                // key={createModal.date.toISOString() + createModal.startTime + createModal.open} 
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
                        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

                        // Optimized Filtering
                        const potentialEvents = eventsByDay.get(dayNumber) || [];
                        const dayEvents = potentialEvents.filter(e => {
                            const eventCreated = new Date(e.created_at || 0);
                            eventCreated.setHours(0, 0, 0, 0);
                            const currentViewDate = new Date(date);
                            currentViewDate.setHours(0, 0, 0, 0);
                            return currentViewDate >= eventCreated;
                        });

                        const daySessions = sessionsByDateKey.get(dateKey) || [];

                        return (
                            <div key={dateKey} className="flex-none w-[200px] md:w-[180px] border-r border-b relative group/col">
                                {/* Header */}
                                <div className="h-14 sticky top-0 bg-background z-30 border-b flex flex-col items-center justify-center font-medium shadow-sm">
                                    <span className="text-sm text-muted-foreground">{dayName}</span>
                                    <span className="text-lg leading-none">{daStr}</span>
                                </div>

                                {/* Body */}
                                <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                                    {/* Grid Lines */}
                                    {HOURS.map(hour => (
                                        role === 'teacher' ? (
                                            <button
                                                key={hour}
                                                type="button"
                                                aria-label={`${String(hour).padStart(2, '0')}:00 saatine ders ekle`}
                                                className="border-b border-dashed border-muted/50 w-full absolute hover:bg-muted/10 transition-colors cursor-pointer group/cell"
                                                style={{ top: (hour - 8) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                                onClick={() => {
                                                    if (isDragging) return;
                                                    setCreateModal({ open: true, date: date, startTime: `${String(hour).padStart(2, '0')}:00` })
                                                }}
                                            >
                                                <div className="hidden group-hover/cell:flex absolute inset-0 items-center justify-center pointer-events-none">
                                                    <div className="bg-primary/10 text-primary rounded-full p-1">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </button>
                                        ) : (
                                            <div
                                                key={hour}
                                                className="border-b border-dashed border-muted/50 w-full absolute"
                                                style={{ top: (hour - 8) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                            />
                                        )
                                    ))}

                                    {/* Standard Events */}
                                    {dayEvents.map(event => {
                                        const { top, height } = getPosition(event.start_time, event.end_time)
                                        const classes = getEventClasses(event, false, currentUserId, role);
                                        const timeRange = `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`

                                        return (
                                            <button
                                                key={event.id}
                                                type="button"
                                                className={cn(
                                                    "absolute rounded px-2 py-1 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden z-20 text-left",
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
                                                <div className={cn("opacity-80 text-[9px] mt-0.5 truncate font-medium", classes.subtitle)}>{event.profiles?.full_name}</div>
                                            </button>
                                        )
                                    })}

                                    {/* Study Sessions */}
                                    {daySessions.map(session => {
                                        const { top, height } = getStudySessionPosition(session.scheduled_at);
                                        const eventTime = new Date(session.scheduled_at);
                                        const endTime = new Date(eventTime.getTime() + 60 * 60 * 1000); // 1 hour fixed
                                        const timeRange = `${eventTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
                                        const classes = getEventClasses(session, true, currentUserId, role);

                                        return (
                                            <button
                                                key={session.id}
                                                type="button"
                                                className={cn(
                                                    "absolute rounded px-2 py-1 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden z-20 text-left",
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
                                                    if (isDragging) return;
                                                    onEventClick?.(session);
                                                }}
                                            >
                                                <div className="absolute top-1 right-1 text-[9px] font-bold opacity-60 uppercase tracking-tighter">Etüt</div>

                                                <div className={cn("text-[10px] opacity-80 font-mono mb-0.5 leading-none", classes.subtitle)}>
                                                    {timeRange}
                                                </div>

                                                <div className={cn("text-xs font-bold leading-tight mt-1", classes.title)}>
                                                    {session.status === 'available' ? (
                                                        <div className="flex items-center gap-1"><CalendarPlus className={cn("w-3.5 h-3.5", classes.icon)} /> Boş</div>
                                                    ) : (
                                                        <div className="line-clamp-2" title={session.topic || 'Dolu'}>{session.topic || 'Dolu'}</div>
                                                    )}
                                                </div>

                                                <div className={cn("text-[11px] opacity-90 truncate font-medium mt-0.5", classes.subtitle)}>
                                                    {(() => {
                                                        if (session.status === 'available') return '';
                                                        const isVisible = role === 'teacher' || (currentUserId && session.student_id === currentUserId);
                                                        return isVisible ? (session.profiles?.full_name || 'Öğrenci') : '';
                                                    })()}
                                                </div>

                                                {currentUserId && session.student_id === currentUserId && <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />}
                                            </button>
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
