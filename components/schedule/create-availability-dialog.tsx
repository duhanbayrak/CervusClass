'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAvailability } from "@/lib/actions/study-session"
import { Loader2, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface CreateAvailabilityDialogProps {
    date: Date | null
    open: boolean
    onOpenChange: (open: boolean) => void
    initialStartTime?: string
}

export function CreateAvailabilityDialog({ date, open, onOpenChange, initialStartTime = "09:00" }: CreateAvailabilityDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [startTime, setStartTime] = useState(initialStartTime)
    const [endTime, setEndTime] = useState(() => {
        if (!initialStartTime) return "10:00";
        const [h, m] = initialStartTime.split(':').map(Number);
        return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    })

    // Reset times when opening or when initialStartTime changes
    // We can use a key or effect in parent, or effect here.
    // Effect here is safer for re-use.
    /* 
       Actually, since we will mount/unmount or change props, 
       we should probably just rely on key in parent or set state when open changes.
       But simplistic approach: use useEffect to sync with props when dialog opens?
       Better: Parent passes `key={selectedSlot.toString()}` to force remount/reset.
    */

    if (!date) return null;

    // Format date for display
    const formattedDate = date.toLocaleDateString("tr-TR", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await createAvailability(isoDate, startTime, endTime)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Müsaitlik slotu oluşturuldu")
                onOpenChange(false)
            }
        } catch (err) {
            toast.error("Bir hata oluştu")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Müsaitlik Ekle</DialogTitle>
                    <DialogDescription>
                        {formattedDate} tarihi için etüt saatleri belirleyin.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start">Başlangıç</Label>
                                <Input
                                    id="start"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Bitiş</Label>
                                <Input
                                    id="end"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Oluştur
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
