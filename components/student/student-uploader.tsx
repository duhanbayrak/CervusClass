'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { uploadStudents } from '@/lib/actions/student-upload'
import * as XLSX from 'xlsx'

export function StudentUploader() {
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsPending(true)

        const formData = new FormData(event.currentTarget)

        try {
            const result = await uploadStudents(null, formData)

            if (result.success) {
                toast.success('Yükleme Başarılı', {
                    description: result.message,
                    duration: 5000
                })
                event.currentTarget.reset()
            } else {
                toast.error('Yükleme Başarısız', {
                    description: result.message,
                    duration: 10000 // Long duration to read errors
                })
            }
        } catch (e) {
            toast.error('Bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    const downloadTemplate = () => {
        const headers = ['Ad Soyad', 'Email', 'Sınıf', 'Parola', 'Öğrenci No', 'Öğrenci Telefon', 'Veli Adı', 'Veli Telefon', 'Doğum Tarihi']
        const data = [
            ['Ali Yılmaz', 'ali@ornek.com', '12-A', '123456', '101', '5551234567', 'Ahmet Yılmaz', '5559876543', '2005-01-01'],
            ['Ayşe Demir', 'ayse@ornek.com', '11-B', 'secret123', '202', '5552223344', 'Fatma Demir', '5558887766', '2006-05-15']
        ]
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Öğrenciler")
        XLSX.writeFile(wb, "ogrenci_sablon.xlsx")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Toplu Öğrenci Yükle</CardTitle>
                <CardDescription>Excel dosyası ile toplu öğrenci ekleyin veya güncelleyin.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Örnek Şablon İndir
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="file">Excel Dosyası (.xlsx, .xls)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept=".xlsx, .xls"
                                required
                                disabled={isPending}
                            />
                            <Button type="submit" disabled={isPending} className="min-w-[100px]">
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Yükle
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <p>Sütunlar: Ad Soyad, Email, Sınıf, Parola, Öğrenci No, Öğrenci Telefon, Veli Adı, Veli Telefon, Doğum Tarihi</p>
                        <p>Not: Email adresi sistemde kayıtlıysa öğrenci bilgileri güncellenir.</p>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
