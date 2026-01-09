import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const isApiRoute = pathname.startsWith('/api');
    const isAuthRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/login');

    if (isAuthRoute) return NextResponse.next();

    const token = request.cookies.get('token')?.value;

    let payload = null;
    if (token) {
        try {
            const { payload: decoded } = await jwtVerify(token, JWT_SECRET);
            payload = decoded;
        } catch (err) {
            // Token invalid or expired
            console.log('Middleware: Invalid token');
        }
    }

    // Protection logic
    // Any route not in (public) matcher is essentially protected
    const isPublic = pathname === '/login' || pathname.startsWith('/api/auth') || pathname.startsWith('/_next');

    // Check if it's an API route vs Page route
    if (!payload) {
        if (isApiRoute) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Redirect to login if not already there
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    // Updated matcher to cover all known routes
    // Updated matcher to cover all known routes
    matcher: [
        '/((?!api/auth|_next/static|_next/image|favicon.ico|login|public).*)',
    ],
};
