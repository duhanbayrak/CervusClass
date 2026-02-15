'use client';

import { useState } from 'react';
import { WeeklyScheduler } from '@/components/schedule/WeeklyScheduler';
import { ScheduleEvent, StudySessionEvent } from '@/types/schedule';
import { EditScheduleDialog } from '@/components/schedule/edit-schedule-dialog';

interface Option {
    id: string;
    label: string;
    branchId?: string;
    branchName?: string;
}

interface AdminScheduleViewProps {
    events: ScheduleEvent[];
    teachers: Option[];
    courses: Option[];
    classes: Option[];
}

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function AdminScheduleView({ events, teachers, courses, classes }: AdminScheduleViewProps) {
    const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

    const handleEventClick = (event: ScheduleEvent | StudySessionEvent) => {
        // Only handle ScheduleEvents (classes) for now in Admin view
        if ('class_id' in event) {
            setSelectedEvent(event as ScheduleEvent);
            setIsEditDialogOpen(true);
        }
    };

    // Filter events based on selected teacher
    const filteredEvents = events.filter(e => e.teacher_id === selectedTeacherId);

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4 bg-background p-3 rounded-md border">
                <div className="w-full md:w-auto flex flex-col md:flex-row md:items-center gap-2">
                    <Label className="text-sm font-medium whitespace-nowrap">Öğretmen Filtresi:</Label>
                    <div className="w-full md:w-[250px]">
                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Öğretmen Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.length === 0 && <SelectItem value="empty" disabled>Öğretmen Bulunamadı</SelectItem>}
                                {teachers.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.label}
                                        {t.branchName && <span className="text-muted-foreground ml-2 text-xs">({t.branchName})</span>}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground md:ml-auto w-full md:w-auto text-right md:text-left">
                    {filteredEvents.length} ders gösteriliyor
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <WeeklyScheduler
                    events={filteredEvents}
                    role="admin"
                    onEventClick={handleEventClick}
                />
            </div>

            <EditScheduleDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                event={selectedEvent}
                teachers={teachers}
                courses={courses}
                classes={classes}
            />
        </div>
    );
}
