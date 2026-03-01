'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadSchedule } from '@/lib/actions/schedule'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'

export function ScheduleUploader() {
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsPending(true)

        const formData = new FormData(event.currentTarget)

        try {
            const result = await uploadSchedule(null, formData)


            if (result.success) {
                toast.success(result.message)
                // Reset form
                event.currentTarget.reset()
            } else {
                toast.error('Yükleme Başarısız', {
                    description: result.message,
                    duration: 10000
                })
            }
        } catch (e) { // NOSONAR
            toast.error('Bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ders Programı Yükle</CardTitle>
                <CardDescription>
                    Excel (.xlsx) formatında haftalık ders programını yükleyin.
                    <br />
                    <span className="text-xs text-muted-foreground">
                        Zorunlu Sütunlar: Sınıf Adı, Gün, Başlangıç Saati, Bitiş Saati, Ders Adı, Öğretmen Email
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file">Excel Dosyası</Label>
                        <Input
                            id="file"
                            name="file"
                            type="file"
                            accept=".xlsx"
                            required
                            disabled={isPending}
                        />
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isPending ? 'Yükleniyor...' : 'Programı Yükle'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
