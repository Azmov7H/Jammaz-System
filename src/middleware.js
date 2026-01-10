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
            console.log('Middleware: Invalid token');
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
