import { signToken, verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const AuthService = {
    /**
     * Authenticate user and set session cookie
     */
    async login({ email, password }) {
        await dbConnect();

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        }

        if (user.isActive === false) {
            throw 'تم تعطيل هذا الحساب. يرجى الاتصال بالمسؤول.';
        }

        // Generate JWT
        const token = await signToken({
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

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                picture: user.picture
            },
            token
        };
    },

    /**
     * Clear session cookie
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
