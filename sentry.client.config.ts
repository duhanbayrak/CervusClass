import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Prod'da hataları yakala, dev'de sadece console
    enabled: process.env.NODE_ENV === 'production',

    // %100 hata yakalama
    tracesSampleRate: 0.1,

    // Session replay — hata anındaki kullanıcı etkileşimini kaydeder
    replaysOnErrorSampleRate: 1,
    replaysSessionSampleRate: 0.05,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],

    // Kullanıcı bilgisi — organizasyon bazlı izleme için
    beforeSend(event) {
        // AbortError'ları Sentry'ye gönderme
        if (event.exception?.values?.[0]?.type === 'AbortError') {
            return null
        }
        return event
    },
})
