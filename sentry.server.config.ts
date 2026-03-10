import * as Sentry from '@sentry/nextjs'

const isSentryEnabled =
    process.env.NODE_ENV === 'production' ||
    process.env.SENTRY_ENABLED === 'true'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    enabled: isSentryEnabled,

    // Tüm hataları yakala
    tracesSampleRate: 1,

    beforeSend(event) {
        return event
    },
})
