'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadExamResult } from '@/lib/actions/exam-results'
import { toast } from 'sonner'
import { Loader2, Upload, FileSpreadsheet, FileText } from 'lucide-react'

export function AdminExamUploader() {
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsPending(true)

        const form = event.currentTarget
        const formData = new FormData(form)

        try {
            // Server Action call
            // We can't pass null as prevState effectively if the action doesn't strictly use it, 
            // but the signature expects it. 
            // However, we are calling it directly here, not via useFormState for now to keep it simple 
            // unless we want to use the hook. 
            // Direct call is fine if the action function signature allows it or we adapt.
            // The action signature is (prevState, formData).
            const result = await uploadExamResult(null, formData)

            if (result.success) {
                toast.success('Başarılı', {
                    description: result.message
                })
                // Reset form
                form.reset()
            } else {
                toast.error('Hata', {
                    description: result.message,
                    duration: 5000
                })
            }
        } catch (e) {
            console.error(e)
            toast.error('Beklenmeyen bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <CardTitle>Sınav Sonucu Yükle</CardTitle>
                </div>
                <CardDescription>
                    Haftalık deneme sınavı sonuçlarını içeren Excel (.xlsx) dosyasını yükleyin.
                    <br />
                    <span className="text-xs text-muted-foreground mt-2 block">
                        Dosya yüklendikten sonra otomatik olarak işlenecektir.
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="exam_name" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Sınav Adı
                        </Label>
                        <Input
                            id="exam_name"
                            name="exam_name"
                            type="text"
                            placeholder="Örn: TYT Deneme - 1"
                            required
                            disabled={isPending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file">Excel Dosyası</Label>
                        <Input
                            id="file"
                            name="file"
                            type="file"
                            accept=".xlsx"
                            required
                            disabled={isPending}
                            className="cursor-pointer"
                        />
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Yükleniyor...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Yükle ve Gönder
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
