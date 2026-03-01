import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // NOSONAR
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                },
            },
        }
    )

    // Sign out functionality
    // We don't need to check getUser() first - if there's a session it kills it, if not it does nothing
    await supabase.auth.signOut()

    // Redirect to home page
    // Using 302/303 to ensure browser redirects correctly after POST
    return NextResponse.redirect(new URL('/', request.url), {
        status: 302,
    })
}
