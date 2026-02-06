'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Users, GraduationCap, School } from 'lucide-react';
import { cn } from '@/lib/utils'; // Ensure you have utils

// Widget Component
function SortableWidget({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn("touch-none", className)}>
            {children}
        </div>
    );
}

// Widget Data Interface
interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    debug?: string;
}

export function DashboardGrid({ stats }: { stats: DashboardStats | null }) {
    const defaultOrder = ['students', 'teachers', 'classes'];
    const [items, setItems] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('dashboard-order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure new widgets are added if local storage is old
                const unique = Array.from(new Set([...parsed, ...defaultOrder]));
                setItems(unique.filter(id => defaultOrder.includes(id))); // Filter out deleted ones
            } catch (e) {
                setItems(defaultOrder);
            }
        } else {
            setItems(defaultOrder);
        }
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('dashboard-order', JSON.stringify(newOrder));
                return newOrder;
            });
        }
    }

    if (!mounted) {
        // Render skeletons or default static layout to prevent hydration mismatch
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Skeleton approximation */}
                {defaultOrder.map(id => (
                    <div key={id} className="rounded-xl border bg-card text-card-foreground shadow p-6 h-32 animate-pulse bg-slate-100 dark:bg-slate-800"></div>
                ))}
            </div>
        );
    }

    const renderWidget = (id: string) => {
        switch (id) {
            case 'students':
                return (
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-full flex flex-col justify-between cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Toplam Öğrenci</h3>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="p-0 pt-2">
                            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                            <p className="text-xs text-muted-foreground">Kayıtlı aktif öğrenci sayısı</p>
                        </div>
                    </div>
                );
            case 'teachers':
                return (
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-full flex flex-col justify-between cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Toplam Öğretmen</h3>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="p-0 pt-2">
                            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
                            <p className="text-xs text-muted-foreground">Kayıtlı eğitmen sayısı</p>
                        </div>
                    </div>
                );
            case 'classes':
                return (
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-full flex flex-col justify-between cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Aktif Sınıflar</h3>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="p-0 pt-2">
                            <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
                            <p className="text-xs text-muted-foreground">Tanımlı sınıf sayısı</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={rectSortingStrategy}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {items.map((id) => (
                        <SortableWidget key={id} id={id}>
                            {renderWidget(id)}
                        </SortableWidget>
                    ))}
                </div>
            </SortableContext>

            {/* Debug Area (Non-draggable) */}
            <div className="col-span-full mt-4">
                {stats?.debug && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                        <p className="font-bold">Debug Info</p>
                        <p>{stats.debug}</p>
                    </div>
                )}
            </div>
        </DndContext>
    );
}
