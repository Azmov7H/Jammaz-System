import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        await AuthService.handleGoogleCallback(code);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/`);
    } catch (error) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
