import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STR = process.env.JWT_SECRET;
if (!JWT_SECRET_STR) {
    console.error('CRITICAL: JWT_SECRET environment variable is missing!');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR || 'placeholder_for_missing_secret');

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const isApiRoute = pathname.startsWith('/api');
    const isAuthRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/public');

    if (isAuthRoute) return NextResponse.next();

    // Debugging: If JWT_SECRET is missing, we might have an issue
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        console.warn('Middleware: JWT_SECRET is not defined in production environment!');
    }

    const token = request.cookies.get('token')?.value;
    console.log(`[Middleware] Path: ${pathname}, HasToken: ${!!token}`);

    let payload = null;
    if (token) {
        try {
            const { payload: decoded } = await jwtVerify(token, JWT_SECRET);
            payload = decoded;
            console.log(`[Middleware] Token Verified: UserID=${payload.userId}, Role=${payload.role}`);
        } catch (err) {
            console.warn(`[Middleware] Token verification failed: ${err.message}`);
        }
    }

    if (!payload && !isAuthRoute) {
        if (isApiRoute) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api/auth|_next/static|_next/image|favicon.ico|login|public).*)',
    ],
};
