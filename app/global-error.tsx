'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

// Global Error must be a Client Component
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // AbortError navigasyon sırasında normal — yok say ve sayfayı sıfırla
        if (error.name === 'AbortError' || error.message === 'The operation was aborted.') {
            reset();
            return;
        }
        Sentry.captureException(error)
    }, [error, reset])

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
                    <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                        <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight">
                        Beklenmedik Bir Hata Oluştu
                    </h1>
                    <p className="mt-2 text-muted-foreground max-w-[500px]">
                        Sistem kritik bir hata ile karşılaştı. Lütfen sayfayı yenilemeyi deneyin veya yönetici ile iletişime geçin.
                    </p>
                    <div className="mt-6 flex gap-4">
                        <Button onClick={() => reset()} variant="default">
                            Tekrar Dene
                        </Button>
                        <Button onClick={() => window.location.href = '/'} variant="outline">
                            Ana Sayfaya Dön
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    )
}
