'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { generateMockExamExcel } from '@/lib/actions/generate-mock-exam'
import { toast } from 'sonner'

export function GenerateMockButton() {
    const [loadingType, setLoadingType] = useState<'TYT' | 'AYT' | null>(null)

    const handleGenerate = async (type: 'TYT' | 'AYT') => {
        setLoadingType(type)
        try {
            const result = await generateMockExamExcel(type)

            if (result.success && result.data) {
                const byteCharacters = atob(result.data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = result.filename || `mock_exam_${type}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                a.remove()

                toast.success(`${type} deneme excel dosyası indirildi.`)
            } else {
                console.error('Mock export failed:', result.message);
                toast.error('Hata', {
                    description: result.message || 'Dosya oluşturulamadı.'
                })
            }
        } catch (error) {
            console.error('Download error:', error)
            toast.error('İndirme sırasında bir hata oluştu.')
        } finally {
            setLoadingType(null)
        }
    }

    return (
        <div className="flex gap-3 w-full">
            <Button
                variant="default" // Primary Blueish (default)
                onClick={() => handleGenerate('TYT')}
                disabled={!!loadingType}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
                {loadingType === 'TYT' ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        TYT Oluşturuluyor...
                    </>
                ) : (
                    <>
                        <FileDown className="mr-2 h-4 w-4" />
                        TYT Deneme Oluştur
                    </>
                )}
            </Button>

            <Button
                variant="secondary" // Secondary Purpleish (custom class)
                onClick={() => handleGenerate('AYT')}
                disabled={!!loadingType}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
                {loadingType === 'AYT' ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        AYT Oluşturuluyor...
                    </>
                ) : (
                    <>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        AYT Deneme Oluştur
                    </>
                )}
            </Button>
        </div>
    )
}
