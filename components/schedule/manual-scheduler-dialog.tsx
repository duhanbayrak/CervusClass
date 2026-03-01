'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { addScheduleItem, ScheduleFormData } from '@/lib/actions/schedule'
import { ScheduleFormFields, ScheduleOption } from './schedule-form-fields'

interface ManualSchedulerDialogProps {
    readonly teachers: ScheduleOption[]
    readonly courses: ScheduleOption[]
    readonly classes: ScheduleOption[]
}

const DEFAULT_FORM: ScheduleFormData = {
    day_of_week: 1,
    start_time: '09:00',
    end_time: '09:40',
    course_id: '',
    teacher_id: '',
    class_id: '',
    room_name: '',
}

export function ManualSchedulerDialog({ teachers, courses, classes }: ManualSchedulerDialogProps) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<ScheduleFormData>(DEFAULT_FORM)

    useEffect(() => {
        if (open) setFormData(DEFAULT_FORM)
    }, [open])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const missingFields = []
        if (!formData.course_id) missingFields.push('Ders')
        if (!formData.teacher_id) missingFields.push('Öğretmen')
        if (!formData.class_id) missingFields.push('Sınıf')
        if (!formData.start_time) missingFields.push('Başlangıç Saati')
        if (!formData.end_time) missingFields.push('Bitiş Saati')

        if (missingFields.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Eksik Bilgi',
                description: `Lütfen şu alanları doldurunuz: ${missingFields.join(', ')}`,
            })
            return
        }

        setIsLoading(true)
        try {
            const result = await addScheduleItem(formData)
            if (result.success) {
                toast({ title: 'Başarılı', description: 'Ders programı başarıyla eklendi.' })
                setOpen(false)
            } else {
                toast({ variant: 'destructive', title: 'Hata', description: result.error || 'Bir hata oluştu.' })
            }
        } catch {
            toast({ variant: 'destructive', title: 'Hata', description: 'Beklenmedik bir hata oluştu.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Manuel Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ders Ekle</DialogTitle>
                    <DialogDescription>Ders programına manuel ekleme yapın.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <ScheduleFormFields
                        formData={formData}
                        onChange={setFormData}
                        teachers={teachers}
                        courses={courses}
                        classes={classes}
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Ekleniyor...' : 'Ekle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
