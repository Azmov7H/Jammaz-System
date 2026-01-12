import { signToken, verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
);

export const AuthService = {
    /**
     * Unified cookie setter
     */
    async setAuthCookie(token) {
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
            sameSite: 'lax',
        });
    },

    /**
     * Authenticate user with email and password
     */
    async login({ email, password }) {
        await dbConnect();

        const user = await User.findOne({ email });
        if (!user || user.isActive === false) {
            throw user?.isActive === false
                ? 'تم تعطيل هذا الحساب. يرجى الاتصال بالمسؤول.'
                : 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        }

        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        await this.setAuthCookie(token);

        return {
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                picture: user.picture
            }
        };
    },

    /**
     * Handle Google OAuth Callback
     */
    async handleGoogleCallback(code) {
        const { tokens } = await googleClient.getToken(code);
        googleClient.setCredentials(tokens);

        const userInfoResponse = await googleClient.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });

        const userInfo = userInfoResponse.data;
        await dbConnect();

        let user = await User.findOne({ email: userInfo.email });

        if (!user) {
            user = await User.create({
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
                role: 'cashier',
            });
        } else {
            user.picture = userInfo.picture;
            await user.save();
        }

        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        await this.setAuthCookie(token);
        return user;
    },

    /**
     * Logout
     */
    async logout() {
        const cookieStore = await cookies();
        cookieStore.delete('token');
        return { message: 'Logged out successfully' };
    },

    /**
     * Get current user session
     */
    async getSession() {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return null;

        const decoded = await verifyToken(token);
        if (!decoded) return null;

        await dbConnect();
        const user = await User.findById(decoded.userId).select('-password -__v').lean();

        if (!user) return null;

        return {
            ...user,
            id: user._id.toString()
        };
    }
};
