import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PROTECTED_PATHS, ProfileRole } from '@/lib/constants'

function isStaticPath(path: string): boolean {
    return (
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.startsWith('/api') ||
        path.includes('.')
    )
}

function getLoginRedirect(path: string, requestUrl: string): NextResponse | null {
    if (path.startsWith('/student') && !path.includes('/login'))
        return NextResponse.redirect(new URL('/student/login', requestUrl))
    if (path.startsWith('/teacher') && !path.includes('/login'))
        return NextResponse.redirect(new URL('/teacher/login', requestUrl))
    if (path.startsWith('/admin') && !path.includes('/login'))
        return NextResponse.redirect(new URL('/admin/login', requestUrl))
    if (path.startsWith('/super-admin') && !path.includes('/login'))
        return NextResponse.redirect(new URL('/super-admin/login', requestUrl))
    return null
}

function getDashboardRedirect(role: ProfileRole, requestUrl: string): NextResponse {
    const dest = role === 'super_admin' ? '/super-admin/dashboard' : `/${role}/dashboard`
    return NextResponse.redirect(new URL(dest, requestUrl))
}

function getRoleForPath(path: string, role: ProfileRole | undefined, requestUrl: string): NextResponse | null {
    for (const [route, allowedRoles] of Object.entries(PROTECTED_PATHS)) {
        if (path.startsWith(route)) {
            if (!role || !allowedRoles.includes(role)) {
                return NextResponse.redirect(new URL('/unauthorized', requestUrl))
            }
        }
    }
    return null
}

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname

    if (isStaticPath(path)) return NextResponse.next()

    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request: { headers: request.headers } })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const redirect = getLoginRedirect(path, request.url)
        return redirect ?? response
    }

    const role = (user.app_metadata?.role ?? user.user_metadata?.role) as ProfileRole

    if (path.includes('/login') && role) {
        return getDashboardRedirect(role, request.url)
    }

    const unauthorized = getRoleForPath(path, role, request.url)
    if (unauthorized) return unauthorized

    return response
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*[.] (?:svg|png|jpg|jpeg|gif|webp)$).*)", // Plain string literal for Next.js static analysis
    ],
}
