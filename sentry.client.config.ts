import * as Sentry from '@sentry/nextjs'

const isSentryEnabled =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    enabled: isSentryEnabled,

    // Tüm hataları yakala
    tracesSampleRate: 1.0,

    // Session replay — hata anındaki kullanıcı etkileşimini kaydeder
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],

    beforeSend(event) {
        // AbortError navigasyon sırasında normaldir — yok say
        if (event.exception?.values?.[0]?.type === 'AbortError') {
            return null
        }
        return event
    },
})
