'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ScheduleFormData } from '@/lib/actions/schedule'

export interface ScheduleOption {
    id: string
    label: string
    branchId?: string
}

interface ScheduleFormFieldsProps {
    readonly formData: ScheduleFormData
    readonly onChange: (data: ScheduleFormData) => void
    readonly teachers: ScheduleOption[]
    readonly courses: ScheduleOption[]
    readonly classes: ScheduleOption[]
}

const DAYS = [
    { value: '1', label: 'Pazartesi' },
    { value: '2', label: 'Salı' },
    { value: '3', label: 'Çarşamba' },
    { value: '4', label: 'Perşembe' },
    { value: '5', label: 'Cuma' },
    { value: '6', label: 'Cumartesi' },
    { value: '7', label: 'Pazar' },
]

export function ScheduleFormFields({ formData, onChange, teachers, courses, classes }: ScheduleFormFieldsProps) {
    const selectedCourse = courses.find(c => c.id === formData.course_id)
    const filteredTeachers = selectedCourse
        ? teachers.filter(t => t.branchId && t.branchId === selectedCourse.branchId)
        : teachers

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartTime = e.target.value
        const updated = { ...formData, start_time: newStartTime }
        if (newStartTime) {
            const [h, m] = newStartTime.split(':').map(Number)
            const date = new Date()
            date.setHours(h)
            date.setMinutes(m + 40)
            updated.end_time = date.toTimeString().slice(0, 5)
        }
        onChange(updated)
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Gün</Label>
                    <Select
                        value={formData.day_of_week.toString()}
                        onValueChange={(val) => onChange({ ...formData, day_of_week: Number.parseInt(val) })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DAYS.map(d => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Sınıf</Label>
                    <Select
                        value={formData.class_id}
                        onValueChange={(val) => onChange({ ...formData, class_id: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sınıf Seç" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Başlangıç</Label>
                    <Input
                        type="time"
                        value={formData.start_time}
                        onChange={handleStartTimeChange}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Bitiş</Label>
                    <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => onChange({ ...formData, end_time: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Ders</Label>
                <Select
                    value={formData.course_id}
                    onValueChange={(val) => onChange({ ...formData, course_id: val })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Ders Seç" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label>Öğretmen</Label>
                <Select
                    value={formData.teacher_id}
                    onValueChange={(val) => onChange({ ...formData, teacher_id: val })}
                    disabled={!formData.course_id && teachers.length > 0}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={formData.course_id ? 'Öğretmen Seç' : 'Önce Ders Seçin'} />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))
                        ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                                Bu branşta öğretmen bulunamadı.
                            </div>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label>Derslik / Oda (Opsiyonel)</Label>
                <Input
                    value={formData.room_name || ''}
                    onChange={(e) => onChange({ ...formData, room_name: e.target.value })}
                    placeholder="Z-01"
                />
            </div>
        </>
    )
}
