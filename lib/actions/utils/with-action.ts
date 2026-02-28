import { z } from 'zod'
import { getAuthContext } from '@/lib/auth-context'
import { logger } from '@/lib/logger'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Tipler ──────────────────────────────────────────────────────────────────

export type ActionContext = {
    supabase: SupabaseClient
    user: User
    organizationId: string
}

export type ActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ─── withAction ───────────────────────────────────────────────────────────────

/**
 * Server action'ları saran Higher-Order Function.
 *
 * Her action için otomatik olarak:
 * 1. Auth context alır (getAuthContext)
 * 2. Zod schema ile input'u validate eder
 * 3. Hataları logger'a iletir (organizationId + action adıyla)
 * 4. try/catch ile beklenmedik hataları yakalar
 * 5. Standart { success, error } formatında döner
 *
 * Kullanım:
 * ```ts
 * const schema = z.object({ name: z.string().min(2) })
 *
 * export const createClass = withAction(schema, async (input, ctx) => {
 *   const { data, error } = await ctx.supabase
 *     .from('classes')
 *     .insert({ name: input.name, organization_id: ctx.organizationId })
 *     .select('id')
 *     .single()
 *
 *   if (error) return { success: false, error: error.message }
 *   return { success: true, data }
 * })
 * ```
 *
 * Input gerektirmeyen action'lar için schema'yı atlayabilirsiniz:
 * ```ts
 * export const getDashboardStats = withAction(async (ctx) => {
 *   // ...
 * })
 * ```
 */

// Overload 1: Schema + handler
export function withAction<TSchema extends z.ZodTypeAny, TReturn>(
    schema: TSchema,
    handler: (input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>
): (input: unknown) => Promise<ActionResult<TReturn>>

// Overload 2: Handler only (no input)
export function withAction<TReturn>(
    handler: (ctx: ActionContext) => Promise<ActionResult<TReturn>>
): () => Promise<ActionResult<TReturn>>

// Implementation
export function withAction<TSchema extends z.ZodTypeAny, TReturn>(
    schemaOrHandler:
        | TSchema
        | ((ctx: ActionContext) => Promise<ActionResult<TReturn>>),
    handler?: (input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>
): ((input: unknown) => Promise<ActionResult<TReturn>>) | (() => Promise<ActionResult<TReturn>>) {

    // Overload 2: sadece handler verilmiş
    if (typeof schemaOrHandler === 'function') {
        const fn = schemaOrHandler as (ctx: ActionContext) => Promise<ActionResult<TReturn>>
        return async (): Promise<ActionResult<TReturn>> => {
            return executeAction(undefined, undefined, fn, undefined)
        }
    }

    // Overload 1: schema + handler
    const schema = schemaOrHandler
    return async (input: unknown): Promise<ActionResult<TReturn>> => {
        return executeAction(input, schema, undefined, handler!)
    }
}

// ─── Ortak çalıştırma mantığı ─────────────────────────────────────────────────

async function executeAction<TSchema extends z.ZodTypeAny, TReturn>(
    input: unknown,
    schema: TSchema | undefined,
    noInputHandler: ((ctx: ActionContext) => Promise<ActionResult<TReturn>>) | undefined,
    withInputHandler: ((input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>) | undefined,
): Promise<ActionResult<TReturn>> {
    // 1. Auth context
    const { supabase, user, organizationId, error: authError } = await getAuthContext()

    if (authError || !user || !organizationId) {
        return { success: false, error: authError || 'Oturum bulunamadı.' }
    }

    const ctx: ActionContext = { supabase, user, organizationId }

    // 2. Zod validation (sadece schema varsa)
    if (schema && input !== undefined) {
        const parsed = schema.safeParse(input)
        if (!parsed.success) {
            const issues = parsed.error.issues
            const first = issues[0]
            const message = first
                ? `${first.path.join('.')}: ${first.message}`
                : 'Geçersiz veri.'
            return { success: false, error: message }
        }

        // 3. Handler çalıştır (validated input ile)
        try {
            return await withInputHandler!(parsed.data, ctx)
        } catch (e: unknown) {
            return handleUnexpectedError(e, ctx)
        }
    }

    // 4. Input gerektirmeyen handler
    try {
        return await noInputHandler!(ctx)
    } catch (e: unknown) {
        return handleUnexpectedError(e, ctx)
    }
}

// ─── Beklenmedik hata yönetimi ────────────────────────────────────────────────

function handleUnexpectedError<TReturn>(
    e: unknown,
    ctx: ActionContext
): ActionResult<TReturn> {
    const message = extractMessage(e)

    logger.error('Beklenmedik server action hatası', {
        userId: ctx.user.id,
        organizationId: ctx.organizationId,
    }, e)

    return { success: false, error: `Beklenmedik bir hata oluştu: ${message}` }
}

function extractMessage(e: unknown): string {
    if (e instanceof Error) return e.message
    if (typeof e === 'string') return e
    if (typeof e === 'object' && e !== null && 'message' in e) {
        return String((e as { message: unknown }).message)
    }
    return 'Bilinmeyen hata'
}
