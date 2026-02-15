'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { generateMockExamExcel } from '@/lib/actions/generate-mock-exam'
import { toast } from 'sonner'

export function GenerateMockButton() {
    const [isLoading, setIsLoading] = useState(false)

    const handleGenerate = async () => {
        setIsLoading(true)
        try {
            const result = await generateMockExamExcel()

            if (result.success && result.data) {
                // Convert base64 to blob
                const byteCharacters = atob(result.data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

                // Create download link
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = result.filename || 'mock_exam.xlsx'
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toast.success('Excel dosyası indirildi.')
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
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                </>
            ) : (
                <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Rastgele Sınav Exceli Üret
                </>
            )}
        </Button>
    )
}
