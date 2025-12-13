import { OAuth2Client } from 'google-auth-library';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
    );

    const authorizeUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
    });

    return NextResponse.redirect(authorizeUrl);
}
