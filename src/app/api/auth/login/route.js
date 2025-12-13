import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' }, { status: 400 });
        }

        await dbConnect();

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 401 });
        }

        // Check pass
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 401 });
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

        return NextResponse.json({ message: 'Success', user: { name: user.name, role: user.role } });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'حدث خطأ في النظام' }, { status: 500 });
    }
}
