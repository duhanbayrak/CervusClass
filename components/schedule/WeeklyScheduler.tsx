'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Schedule } from '@/types/database'
import { Loader2, CalendarPlus, User, Plus } from 'lucide-react'
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

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 08:00 - 21:00
const HOUR_HEIGHT = 100

export function WeeklyScheduler({ events, studySessions = [], role, onDelete, onEventClick, onSlotClick, currentUserId }: WeeklySchedulerProps) {

    // Helper to determine style
    const getEventStyle = (event: ScheduleEvent | StudySessionEvent, isStudySession: boolean) => {
        if (isStudySession) {
            const s = event as StudySessionEvent;
            const isMySession = currentUserId && s.student_id === currentUserId;

            if (s.status === 'available') {
                return {
                    backgroundColor: `hsl(142, 70%, 95%)`, // Green-ish (Available)
                    borderColor: `hsl(142, 70%, 50%)`,
                    color: `hsl(142, 90%, 20%)`
                }
            } else if (isMySession) {
                return {
                    backgroundColor: `hsl(200, 90%, 90%)`, // Blue-ish (My Session)
                    borderColor: `hsl(200, 90%, 50%)`,
                    color: `hsl(200, 90%, 20%)`
                }
            } else {
                // Booked by someone else (or pending for teacher view, but teacher has different role check usually)
                // For student view: Gray "Dolu"
                // For teacher view: keep yellow/blue distinction?
                // The user said: "Student sees only Dolu/time. If my session different color."

                if (role === 'teacher') {
                    if (s.status === 'pending') {
                        return {
                            backgroundColor: `hsl(45, 90%, 90%)`, // Yellow (Pending)
                            borderColor: `hsl(45, 90%, 50%)`,
                            color: `hsl(45, 90%, 20%)`
                        }
                    }
                    return {
                        backgroundColor: `hsl(210, 90%, 90%)`, // Standard Blue
                        borderColor: `hsl(210, 90%, 50%)`,
                        color: `hsl(210, 90%, 20%)`
                    }
                }

                return {
                    backgroundColor: `hsl(0, 0%, 93%)`, // Gray (Occupied)
                    borderColor: `hsl(0, 0%, 75%)`,
                    color: `hsl(0, 0%, 40%)`
                }
            }
        }

        // Standard Class Event
        const e = event as ScheduleEvent;
        const string = e.courses?.name || 'default'
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

        // Assume 1 hour duration for availability slots by default if not specified? 
        // Or passed in? For now, let's say slots are 1 hour unless we store duration.
        // Study sessions schema has only ONE timestamp (start).
        // Let's assume 1 hour fixed for simplicity or 50 mins.

        const startOffset = (h - 8) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
        const duration = 60 / 60 * HOUR_HEIGHT; // 1 hour fixed
        return { top: startOffset, height: duration }
    }



    // Drag to Scroll Logic
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
        // Don't capture yet - wait for move threshold
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

        // Threshold check (5px)
        if (!isDragging && dist > 5) {
            setIsDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
        }

        if (isDragging || dist > 5) { // Logic: if we are dragging or just passed threshold
            const walk = (x - startX.current) * 2; // Scroll-fast
            scrollRef.current.scrollLeft = startScrollLeft.current - walk;
        }
    };

    // Generate dates starting from today for the next 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    });

    const isSameDate = (d1: Date, stringDate: string) => {
        const d2 = new Date(stringDate);
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    }

    const [createModal, setCreateModal] = useState<{ open: boolean, date: Date | null, startTime?: string }>({
        open: false,
        date: null
    });

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border overflow-hidden">
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
                    <div className="sticky left-0 bg-background z-30 border-r border-b w-16 flex-none">
                        <div className="h-14 border-b bg-background sticky top-0 z-40"></div> {/* Header Corner */}
                        {HOURS.map(hour => (
                            <div key={hour} className="border-b text-xs text-muted-foreground relative bg-background" style={{ height: HOUR_HEIGHT }}>
                                <span className="absolute -top-2 left-1 bg-background/80 px-1">{hour.toString().padStart(2, '0')}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Date Columns */}
                    {dates.map((date, i) => {
                        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
                        const daStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                        const dayNumber = date.getDay() || 7; // 1 (Mon) - 7 (Sun)

                        // Filter Standard Events (Recurring by weekday)
                        const dayEvents = events.filter(e => e.day_of_week === dayNumber);

                        // Filter Study Sessions (Exact date)
                        const daySessions = studySessions.filter(s => isSameDate(date, s.scheduled_at));

                        return (
                            <div key={i} className="flex-none w-[calc(100vw-4rem)] md:w-[180px] border-r border-b relative group/col">
                                {/* Header */}
                                <div className="h-14 sticky top-0 bg-background z-20 border-b flex flex-col items-center justify-center font-medium shadow-sm">
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
                                        return (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    "absolute rounded px-2 py-1 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden z-10",
                                                    "flex flex-col justify-start"
                                                )}
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    left: '2px',
                                                    right: '2px',
                                                    ...getEventStyle(event, false)
                                                }}
                                                onClick={() => onEventClick?.(event)}
                                            >
                                                <div className="font-bold leading-tight">{event.courses?.name}</div>
                                                <div className="opacity-90 text-[10px]">{event.classes?.name}</div>
                                            </div>
                                        )
                                    })}

                                    {/* Study Sessions */}
                                    {daySessions.map(session => {
                                        const { top, height } = getStudySessionPosition(session.scheduled_at);
                                        const eventTime = new Date(session.scheduled_at);
                                        const endTime = new Date(eventTime.getTime() + 60 * 60 * 1000); // 1 hour fixed
                                        const timeRange = `${eventTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

                                        return (
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    "absolute rounded px-2 py-1 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden z-20",
                                                    "flex flex-col justify-start",
                                                    session.status === 'available' ? "border-dashed" : "border-solid"
                                                )}
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    left: '4px',
                                                    right: '4px',
                                                    ...getEventStyle(session, true)
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isDragging) return; // Prevent click if dragging
                                                    onEventClick?.(session);
                                                }}
                                            >
                                                <div className="text-[9px] opacity-80 font-mono mb-0.5 leading-none">
                                                    {timeRange}
                                                </div>

                                                <div className="font-bold leading-tight flex items-center gap-1">
                                                    {session.status === 'available' ? (
                                                        <><CalendarPlus className="w-3 h-3" /> Boş</>
                                                    ) : (
                                                        <>{session.topic || 'Dolu'}</>
                                                    )}
                                                </div>

                                                <div className="text-[10px] opacity-90 truncate font-medium">
                                                    {session.status === 'available' ? 'Müsaitlik' :
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
