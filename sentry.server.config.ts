import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    enabled: process.env.NODE_ENV === 'production',

    // Server-side trace sampling — performans izleme
    tracesSampleRate: 0.1,

    // Server action ve API route hatalarını yakala
    beforeSend(event) {
        return event
    },
})
