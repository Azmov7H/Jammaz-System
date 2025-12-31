import { NextResponse } from 'next/server';

export function middleware(request) {
    // Simple check for cookie existence in Edge Runtime
    // 'jsonwebtoken' is not compatible with Edge Runtime by default in some bundlers
    // Detailed verification happens in API Routes (Node Runtime)

    const { pathname } = request.nextUrl;
    const isApiRoute = pathname.startsWith('/api');
    const isAuthRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/login');

    if (isAuthRoute) return NextResponse.next();

    const token = request.cookies.get('token')?.value;

    // Fast check for protected routes
    const isProtectedRoute = !isApiRoute && (
        pathname === '/' ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/products') ||
        pathname.startsWith('/invoices') ||
        pathname.startsWith('/stock') ||
        pathname.startsWith('/receivables') ||
        pathname.startsWith('/suppliers') ||
        pathname.startsWith('/users') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/accounting') ||
        pathname.startsWith('/reports') ||
        pathname.startsWith('/log')
    );

    if (isProtectedRoute) {
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    if (isApiRoute) {
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    // Updated matcher to cover all known routes
    matcher: [
        '/dashboard/:path*',
        '/api/:path*',
        '/products/:path*',
        '/invoices/:path*',
        '/stock/:path*',
        '/receivables/:path*',
        '/suppliers/:path*',
        '/users/:path*',
        '/settings/:path*',
        '/accounting/:path*',
        '/reports/:path*',
        '/log/:path*'
    ],
};
