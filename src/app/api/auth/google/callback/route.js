import { OAuth2Client } from 'google-auth-library';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
        );

        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Get basic profile info
        const userInfoResponse = await client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });

        const userInfo = userInfoResponse.data;

        await dbConnect();

        // Find or create user
        let user = await User.findOne({ email: userInfo.email });

        if (!user) {
            user = await User.create({
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
                role: 'cashier', // Default role. Owner should be set manually in DB or via seed for first user
            });
        } else {
            // Update picture if changed
            user.picture = userInfo.picture;
            await user.save();
        }

        // Generate JWT
        const token = signToken({
            userId: user._id,
            email: user.email,
            role: user.role,
        });

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`);

    } catch (error) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
