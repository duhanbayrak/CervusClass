import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PROTECTED_PATHS, ProfileRole } from '@/lib/constants'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. Exclude public files and api routes EARLY
    // This prevents unnecessary Supabase client initialization and auth checks for static assets
    if (path.startsWith('/_next') || path.startsWith('/static') || path.startsWith('/api') || path.includes('.')) {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 2. Initialize Supabase Server Client (Only for non-static routes)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 3. Check Auth Status
    const { data: { user } } = await supabase.auth.getUser()

    // 4. Subdomain Logic (Placeholder)
    // const hostname = request.headers.get('host') || '';

    // 5. Auth & Role Redirection
    if (!user) {
        // If unauthorized user tries to access any protected route, redirect to specific login
        if (path.startsWith('/student') && !path.includes('/login')) return NextResponse.redirect(new URL('/student/login', request.url));
        if (path.startsWith('/teacher') && !path.includes('/login')) return NextResponse.redirect(new URL('/teacher/login', request.url));
        if (path.startsWith('/admin') && !path.includes('/login')) return NextResponse.redirect(new URL('/admin/login', request.url));
        if (path.startsWith('/super-admin') && !path.includes('/login')) return NextResponse.redirect(new URL('/super-admin/login', request.url));
        return response;
    }

    // If user is Logged In
    if (user) {
        // Optimized: Fetch user role from JWT metadata (Prioritize app_metadata for security)
        const role = user.app_metadata?.role as ProfileRole || user.user_metadata?.role as ProfileRole;

        // Redirect away from login pages to Dashboard
        if (path.includes('/login')) {
            if (role) {
                return NextResponse.redirect(new URL(role === 'super_admin' ? '/super-admin/dashboard' : `/${role}/dashboard`, request.url))
            }
        }

        // Check access permission for current path
        // Iterate over protected paths to find if current path starts with one
        for (const [route, allowedRoles] of Object.entries(PROTECTED_PATHS)) {
            if (path.startsWith(route)) {
                if (!role || !allowedRoles.includes(role)) {
                    // Unauthorized to access this section
                    // Redirect to their own dashboard or authorized page
                    return NextResponse.redirect(new URL('/unauthorized', request.url));
                }
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
