import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-context'

export type ApiHandlerContext = {
    userId: string
    organizationId: string
    userEmail?: string
}

type ApiHandler<T = unknown> = (
    request: Request,
    ctx: ApiHandlerContext
) => Promise<NextResponse<T>>

/**
 * API route handler'larını saran Higher-Order Function.
 *
 * Her handler için otomatik olarak:
 * 1. Auth context alır ve Sentry kullanıcı bağlamını set eder
 * 2. Beklenmedik hataları Sentry'ye iletir (zengin bağlamla)
 * 3. Standart 500 JSON yanıtı döner
 *
 * Kullanım:
 * ```ts
 * export const GET = withApiHandler('accounting:get_accounts', async (req, ctx) => {
 *   // ctx.userId, ctx.organizationId mevcut
 *   return NextResponse.json({ data })
 * })
 * ```
 */
export function withApiHandler<T = unknown>(
    routeName: string,
    handler: ApiHandler<T>
): (request: Request) => Promise<NextResponse> {
    return async (request: Request): Promise<NextResponse> => {
        const { user, organizationId, error: authError } = await getAuthContext()

        if (authError || !user || !organizationId) {
            return NextResponse.json(
                { error: authError || 'Unauthorized' },
                { status: 401 }
            )
        }

        const ctx: ApiHandlerContext = {
            userId: user.id,
            organizationId,
            userEmail: user.email,
        }

        try {
            return await handler(request, ctx) as NextResponse
        } catch (e: unknown) {
            const err = e instanceof Error ? e : new Error(typeof e === 'object' ? JSON.stringify(e) : String(e))

            Sentry.withScope((scope) => {
                scope.setUser({ id: user.id, email: user.email })
                scope.setTag('route', routeName)
                scope.setTag('organization_id', organizationId)
                scope.setTag('method', request.method)
                scope.setExtra('url', request.url)
                scope.setLevel('error')
                Sentry.captureException(err)
            })

            console.error(`[API Error] ${routeName}:`, err)

            return NextResponse.json(
                { error: 'Beklenmedik bir hata oluştu.' },
                { status: 500 }
            )
        }
    }
}

/**
 * Auth gerektirmeyen public API route'lar için basit wrapper.
 * Sadece hataları yakalar ve Sentry'ye iletir.
 */
export function withPublicApiHandler<T = unknown>(
    routeName: string,
    handler: (request: Request) => Promise<NextResponse<T>>
): (request: Request) => Promise<NextResponse> {
    return async (request: Request): Promise<NextResponse> => {
        try {
            return await handler(request) as NextResponse
        } catch (e: unknown) {
            const err = e instanceof Error ? e : new Error(typeof e === 'object' ? JSON.stringify(e) : String(e))

            Sentry.withScope((scope) => {
                scope.setTag('route', routeName)
                scope.setTag('method', request.method)
                scope.setExtra('url', request.url)
                scope.setLevel('error')
                Sentry.captureException(err)
            })

            console.error(`[API Error] ${routeName}:`, err)

            return NextResponse.json(
                { error: 'Beklenmedik bir hata oluştu.' },
                { status: 500 }
            )
        }
    }
}
