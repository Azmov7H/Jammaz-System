import { NextResponse } from 'next/server';

export function middleware(request) {
    // Simple check for cookie existence in Edge Runtime
    // 'jsonwebtoken' is not compatible with Edge Runtime by default in some bundlers
    // Detailed verification happens in API Routes (Node Runtime)

    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Protect Dashboard
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Protect API (except auth)
    // We double check here for presence, but API routes will verify signature
    if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/:path*'],
};
