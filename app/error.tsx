'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
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
        <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Bir Şeyler Ters Gitti!</h2>
            <p className="mt-2 text-muted-foreground max-w-[400px]">
                İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.
            </p>
            <div className="mt-6">
                <Button onClick={() => reset()}>
                    Tekrar Dene
                </Button>
            </div>
        </div>
    )
}
