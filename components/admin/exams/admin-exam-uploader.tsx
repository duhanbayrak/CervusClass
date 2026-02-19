'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { uploadExamResult } from '@/lib/actions/exam-results'
import { toast } from 'sonner'
import { Loader2, Upload, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react'

export function AdminExamUploader() {
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsPending(true)

        const form = event.currentTarget
        const formData = new FormData(form)

        // Manual validation for exam_type if needed, but 'required' attribute on RadioGroup input handles it mostly.
        // Shadcn RadioGroup doesn't use native inputs directly visible, so formData might miss it if not careful.
        // Shadcn RadioGroup uses a hidden input if implementing correctly or we need to manage state.
        // Actually, Shadcn RadioGroup *does* work with FormData if we give it a name prop, 
        // essentially it renders a hidden input. Let's verify or stick to controlled if unsure.
        // For simplicity and to ensure formData captures it, using a hidden input with controlled state or relying on native behavior if supported.
        // Standard Shadcn RadioGroup: <RadioGroup name="exam_type"> ... </RadioGroup> works.

        try {
            const result = await uploadExamResult(null, formData)

            if (result.success) {
                toast.success('Başarılı', {
                    description: result.message
                })
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
                        Lütfen sınav türünü doğru seçtiğinizden emin olun.
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Exam Name */}
                    <div className="space-y-2">
                        <Label htmlFor="exam_name" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Sınav Adı
                        </Label>
                        <Input
                            id="exam_name"
                            name="exam_name"
                            type="text"
                            placeholder="Örn: Deneme - 1"
                            required
                            disabled={isPending}
                        />
                    </div>

                    {/* Exam Type Selection */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Sınav Türü
                        </Label>
                        <RadioGroup name="exam_type" defaultValue="" required className="grid grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="TYT" id="tyt" className="peer sr-only" />
                                <Label
                                    htmlFor="tyt"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
                                >
                                    <span className="text-xl font-bold mb-1">TYT</span>
                                    <span className="text-xs text-muted-foreground text-center">Temel Yeterlilik</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="AYT" id="ayt" className="peer sr-only" />
                                <Label
                                    htmlFor="ayt"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
                                >
                                    <span className="text-xl font-bold mb-1">AYT</span>
                                    <span className="text-xs text-muted-foreground text-center">Alan Yeterlilik</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* File Upload */}
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
