import { z } from 'zod'
import { getAuthContext } from '@/lib/auth-context'
import { logger } from '@/lib/logger'
import type { User, SupabaseClient } from '@supabase/supabase-js'

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

// Overload 1: Action adı + Schema + handler
export function withAction<TSchema extends z.ZodTypeAny, TReturn>(
    actionName: string,
    schema: TSchema,
    handler: (input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>
): (input: unknown) => Promise<ActionResult<TReturn>>

// Overload 2: Action adı + Handler only (no input)
export function withAction<TReturn>(
    actionName: string,
    handler: (ctx: ActionContext) => Promise<ActionResult<TReturn>>
): () => Promise<ActionResult<TReturn>>

// Overload 3: Schema + handler (geriye dönük uyumluluk)
export function withAction<TSchema extends z.ZodTypeAny, TReturn>(
    schema: TSchema,
    handler: (input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>
): (input: unknown) => Promise<ActionResult<TReturn>>

// Overload 4: Handler only (geriye dönük uyumluluk)
export function withAction<TReturn>(
    handler: (ctx: ActionContext) => Promise<ActionResult<TReturn>>
): () => Promise<ActionResult<TReturn>>

// Implementation
export function withAction<TSchema extends z.ZodTypeAny, TReturn>(
    arg1: string | TSchema | ((ctx: ActionContext) => Promise<ActionResult<TReturn>>),
    arg2?: TSchema | ((input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>) | ((ctx: ActionContext) => Promise<ActionResult<TReturn>>),
    arg3?: (input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>
): ((input: unknown) => Promise<ActionResult<TReturn>>) | (() => Promise<ActionResult<TReturn>>) {

    // Overload 4: sadece handler (no-input, legacy)
    if (typeof arg1 === 'function') {
        const fn = arg1 as (ctx: ActionContext) => Promise<ActionResult<TReturn>>
        return async (): Promise<ActionResult<TReturn>> => {
            return executeAction(undefined, undefined, fn, undefined, undefined)
        }
    }

    // arg1 is string (action name) or schema
    if (typeof arg1 === 'string') {
        const actionName = arg1

        // Overload 2: name + handler (no-input)
        if (typeof arg2 === 'function') {
            const fn = arg2 as (ctx: ActionContext) => Promise<ActionResult<TReturn>>
            return async (): Promise<ActionResult<TReturn>> => {
                return executeAction(undefined, undefined, fn, undefined, actionName)
            }
        }

        // Overload 1: name + schema + handler
        const schema = arg2 as TSchema
        const handler = arg3!
        return async (input: unknown): Promise<ActionResult<TReturn>> => {
            return executeAction(input, schema, undefined, handler, actionName)
        }
    }

    // Overload 3: schema + handler (legacy, no name)
    const schema = arg1 as TSchema
    const handler = arg2 as (input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>
    return async (input: unknown): Promise<ActionResult<TReturn>> => {
        return executeAction(input, schema, undefined, handler, undefined)
        // NOSONAR
    }
}

// ─── Ortak çalıştırma mantığı ─────────────────────────────────────────────────

async function executeAction<TSchema extends z.ZodTypeAny, TReturn>(
    input: unknown,
    schema: TSchema | undefined,
    noInputHandler: ((ctx: ActionContext) => Promise<ActionResult<TReturn>>) | undefined,
    withInputHandler: ((input: z.infer<TSchema>, ctx: ActionContext) => Promise<ActionResult<TReturn>>) | undefined,
    actionName: string | undefined,
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
            return handleUnexpectedError(e, ctx, actionName)
        }
    }

    // 4. Input gerektirmeyen handler
    try {
        return await noInputHandler!(ctx)
    } catch (e: unknown) {
        return handleUnexpectedError(e, ctx, actionName)
    }
}

// ─── Beklenmedik hata yönetimi ────────────────────────────────────────────────

function handleUnexpectedError<TReturn>(
    e: unknown,
    ctx: ActionContext,
    actionName?: string
): ActionResult<TReturn> {
    const message = extractMessage(e)

    logger.error('Beklenmedik server action hatası', {
        userId: ctx.user.id,
        organizationId: ctx.organizationId,
        action: actionName,
    }, e)

    return { success: false, error: `Beklenmedik bir hata oluştu: ${message}` }
}

function extractMessage(e: unknown): string {
    if (e instanceof Error) return e.message
    if (typeof e === 'string') return e
    if (typeof e === 'object' && e !== null && 'message' in e) {
        return String((e as Record<string, unknown>).message)
    }
    return 'Bilinmeyen hata'
}
