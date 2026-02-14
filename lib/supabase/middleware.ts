import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Public paths that don't require auth
    const publicPaths = ['/login', '/register', '/auth/callback'];
    const isPublicPath = publicPaths.some((p) =>
        request.nextUrl.pathname.startsWith(p),
    );

    // If not logged in and trying to access protected route → redirect to login
    if (!user && !isPublicPath && request.nextUrl.pathname !== '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If logged in and trying to access auth pages → redirect to dashboard
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
        // Fetch user role to redirect to the correct dashboard
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = userData?.role || 'nasabah';
        const url = request.nextUrl.clone();
        url.pathname = `/dashboard/${role}`;
        return NextResponse.redirect(url);
    }

    // Role-based route protection for dashboard
    if (user && request.nextUrl.pathname.startsWith('/dashboard/')) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = userData?.role;
        const pathSegments = request.nextUrl.pathname.split('/');
        const dashboardRole = pathSegments[2]; // /dashboard/{role}/...

        if (role && dashboardRole && role !== dashboardRole) {
            const url = request.nextUrl.clone();
            url.pathname = `/dashboard/${role}`;
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
