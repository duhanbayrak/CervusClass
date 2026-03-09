import * as Sentry from '@sentry/nextjs'

// ─── Tipler ──────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = {
    /** Hangi kullanıcı — Sentry'de user.id olarak görünür */
    userId?: string
    /** Hangi kurum — multi-tenant izleme için kritik */
    organizationId?: string
    /** Hangi server action veya fonksiyon */
    action?: string
    /** Hangi URL path */
    path?: string
    /** Ek bağlam — serbestçe genişletilebilir */
    [key: string]: unknown
}

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const ts = new Date().toISOString()
    const org = context?.organizationId ? `[org:${context.organizationId}]` : ''
    const usr = context?.userId ? `[user:${context.userId}]` : ''
    const act = context?.action ? `[${context.action}]` : ''
    return `${ts} [${level.toUpperCase()}]${org}${usr}${act} ${message}`
}

function extractError(error: unknown): Error | undefined {
    if (error instanceof Error) return error
    if (typeof error === 'string') return new Error(error)
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return new Error(String((error as { message: unknown }).message))
    }
    return undefined
}

// ─── Logger ──────────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
    debug(message: string, context?: LogContext): void {
        if (!isDev) return
        console.debug(formatMessage('debug', message, context), context ?? '')
    },

    info(message: string, context?: LogContext): void {
        if (isDev) {
            console.info(formatMessage('info', message, context), context ?? '')
            return
        }
        Sentry.addBreadcrumb({
            message,
            level: 'info',
            data: context,
        })
    },

    warn(message: string, context?: LogContext): void {
        if (isDev) {
            console.warn(formatMessage('warn', message, context), context ?? '')
            return
        }
        Sentry.addBreadcrumb({
            message,
            level: 'warning',
            data: context,
        })
        // warn'ları Sentry'ye event olarak gönder (hata sayılmaz, izlenir)
        Sentry.withScope((scope) => {
            if (context?.userId) scope.setUser({ id: context.userId })
            if (context?.organizationId) scope.setTag('organization_id', context.organizationId)
            if (context?.action) scope.setTag('action', context.action)
            if (context) scope.setExtras(context)
            scope.setLevel('warning')
            Sentry.captureMessage(message)
        })
    },

    error(message: string, context?: LogContext, error?: unknown): void {
        const err = extractError(error)

        if (isDev) {
            console.error(formatMessage('error', message, context), context ?? '', err ?? '')
            return
        }

        Sentry.withScope((scope) => {
            if (context?.userId) scope.setUser({ id: context.userId })
            if (context?.organizationId) scope.setTag('organization_id', context.organizationId)
            if (context?.action) scope.setTag('action', context.action)
            if (context?.path) scope.setTag('path', context.path)
            if (context) scope.setExtras(context)
            scope.setLevel('error')

            if (err) {
                Sentry.captureException(err)
            } else {
                Sentry.captureMessage(message)
            }
        })

        // Production'da da console'a yaz — server log'larında görünsün
        console.error(formatMessage('error', message, context), err ?? error ?? '')
    },
}

// ─── handleError (mevcut utility'nin yerini alır) ─────────────────────────────

/**
 * Bilinmeyen tipte bir hatayı okunabilir string'e dönüştürür.
 * Server action catch bloklarında kullanılır.
 */
export function handleError(e: unknown, context?: LogContext): string {
    const message = (() => {
        if (e instanceof Error) return e.message
        if (typeof e === 'string') return e
        if (typeof e === 'object' && e !== null) {
            if ('message' in e) return String((e as { message: unknown }).message)
            if ('error' in e) return String((e as { error: unknown }).error)
            try { return JSON.stringify(e) } catch { return 'Nesne hatası' }
        }
        return `Bilinmeyen hata tipi: ${typeof e}`
    })()

    logger.error(message, context, e)
    return message
}
