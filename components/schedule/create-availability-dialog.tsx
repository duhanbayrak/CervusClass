'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAvailability } from "@/lib/actions/study-session"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface CreateAvailabilityDialogProps {
    date: Date | null
    open: boolean
    onOpenChange: (open: boolean) => void
    initialStartTime?: string
}

export function CreateAvailabilityDialog({ date, open, onOpenChange, initialStartTime = "09:00" }: Readonly<CreateAvailabilityDialogProps>) {
    // NOSONAR
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [startTime, setStartTime] = useState(initialStartTime)
    const [endTime, setEndTime] = useState(() => {
        if (!initialStartTime) return "10:00";
        const [h, m] = initialStartTime.split(':').map(Number);
        return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    })
    const [slotCount, setSlotCount] = useState("1")

    if (!date) return null;

    // Format date for display
    const formattedDate = date.toLocaleDateString("tr-TR", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await createAvailability(isoDate, startTime, endTime, parseInt(slotCount))

            if (result?.error) {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: result.error
                })
            } else if (result?.success) {
                toast({
                    title: "Başarılı",
                    description: "Müsaitlik slotu oluşturuldu"
                })
                onOpenChange(false)
            } else {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: "Beklenmedik bir hata oluştu"
                })
            }
        } catch (err) {
            console.error('Error creating availability:', err);
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Bir hata oluştu"
            })
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
                        <div className="space-y-2">
                            <Label htmlFor="slots">Kaç Etüde Bölünsün?</Label>
                            <Select value={slotCount} onValueChange={setSlotCount}>
                                <SelectTrigger id="slots">
                                    <SelectValue placeholder="Bölüm sayısı seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Bölme (1 Etüt)</SelectItem>
                                    <SelectItem value="2">2'ye Böl</SelectItem>
                                    <SelectItem value="3">3'e Böl</SelectItem>
                                    <SelectItem value="4">4'e Böl</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Örn: 1 saatlik aralığı 4'e bölerseniz her biri 15 dakikalık 4 etüt açılır.
                            </p>
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

