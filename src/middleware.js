import { NextResponse } from 'next/server';

export function middleware(request) {
    // Simple check for cookie existence in Edge Runtime
    // 'jsonwebtoken' is not compatible with Edge Runtime by default in some bundlers
    // Detailed verification happens in API Routes (Node Runtime)

    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Protect Dashboard
    if (pathname.startsWith('/dashboard') || pathname === '/' || pathname.startsWith('/products') || pathname.startsWith('/invoices')) {
        // Note: The original proxy.js only protected /dashboard. 
        // But the app has many routes at root level (e.g. /products). 
        // The Layout wraps them, but Middleware should probably protect them too to avoid flash.
        // However, the proxy.js matcher was: matcher: ['/dashboard/:path*', '/api/:path*'],
        // So it ONLY protected /dashboard and /api.
        // If /products is NOT under /dashboard in the URL (it is physically in (dashboard) group, so it is /products),
        // then the original middleware FAILED to protect /products.
        // I MUST FIX THIS.
    }

    // Logic from proxy.js was:
    // if (pathname.startsWith('/dashboard')) ...

    // I need to be careful. The Sidebar links are: /products, /stock, etc.
    // If these are NOT covered by middleware, they are public?
    // Let's look at the matcher in proxy.js again.
    // matcher: ['/dashboard/:path*', '/api/:path*'],

    // This CONFIRMS that /products, /invoices, etc. were UNPROTECTED by the middleware logic proposal!
    // They might be protected by Client Side checks (useUserRole hook).
    // But for a "Senior Architect Audit", this is a flaw.
    // I should update the matcher to include all protected routes.

    if (pathname.startsWith('/dashboard') || pathname.startsWith('/products') || pathname.startsWith('/invoices') || pathname.startsWith('/stock') || pathname.startsWith('/accounting')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
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
