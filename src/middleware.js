import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STR = process.env.JWT_SECRET;
if (!JWT_SECRET_STR) {
    console.error('CRITICAL ERROR: JWT_SECRET environment variable is missing! Authentication will fail.');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const isApiRoute = pathname.startsWith('/api');
    const isAuthRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/public');

    if (isAuthRoute) return NextResponse.next();

    const token = request.cookies.get('token')?.value;

    let payload = null;
    if (token) {
        try {
            const { payload: decoded } = await jwtVerify(token, JWT_SECRET);
            payload = decoded;
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
