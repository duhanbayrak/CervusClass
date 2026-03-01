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
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { updateScheduleItem, deleteScheduleItem, ScheduleFormData } from '@/lib/actions/schedule'
import { Loader2 } from 'lucide-react'
import { ScheduleFormFields, ScheduleOption } from './schedule-form-fields'

interface EditScheduleDialogProps {
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
    readonly event: Record<string, unknown> | null
    readonly teachers: ScheduleOption[]
    readonly courses: ScheduleOption[]
    readonly classes: ScheduleOption[]
}

const DEFAULT_FORM: ScheduleFormData = {
    day_of_week: 1,
    start_time: '',
    end_time: '',
    course_id: '',
    teacher_id: '',
    class_id: '',
    room_name: '',
}

export function EditScheduleDialog({ open, onOpenChange, event, teachers, courses, classes }: EditScheduleDialogProps) {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formData, setFormData] = useState<ScheduleFormData>(DEFAULT_FORM)

    useEffect(() => {
        if (event) {
            setFormData({
                day_of_week: event.day_of_week as number,
                start_time: (event.start_time as string)?.slice(0, 5) || '',
                end_time: (event.end_time as string)?.slice(0, 5) || '',
                course_id: event.course_id as string,
                teacher_id: event.teacher_id as string,
                class_id: event.class_id as string,
                room_name: (event.room_name as string) || '',
            })
        }
    }, [event])

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!event) return
        setIsLoading(true)
        try {
            const result = await updateScheduleItem({ id: event.id as string, formData })
            if (result.success) {
                toast({ description: 'Ders güncellendi.' })
                onOpenChange(false)
            } else {
                toast({ variant: 'destructive', title: 'Hata', description: result.error })
            }
        } catch {
            toast({ variant: 'destructive', title: 'Hata', description: 'Hata oluştu.' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!event) return
        if (!confirm('Bu dersi silmek istediğinize emin misiniz?')) return
        setIsDeleting(true)
        try {
            const result = await deleteScheduleItem({ id: event.id as string })
            if (result.success) {
                toast({ description: 'Ders silindi.' })
                onOpenChange(false)
            } else {
                toast({ variant: 'destructive', title: 'Hata', description: result.error })
            }
        } catch {
            toast({ variant: 'destructive', title: 'Hata', description: 'Hata oluştu.' })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ders Düzenle</DialogTitle>
                    <DialogDescription>Ders bilgilerini güncelleyin veya silin.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="grid gap-4 py-4">
                    <ScheduleFormFields
                        formData={formData}
                        onChange={setFormData}
                        teachers={teachers}
                        courses={courses}
                        classes={classes}
                    />
                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isLoading}>
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dersi Sil'}
                        </Button>
                        <Button type="submit" disabled={isLoading || isDeleting}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Güncelle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
