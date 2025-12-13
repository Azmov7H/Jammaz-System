import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

export async function GET(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user || user.role === 'cashier' || user.role === 'warehouse' || user.role === 'viewer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const currentUser = await getCurrentUser();
        // Only Owner can create new users (or Manager if logic permits, let's stick to Owner/Manager)
        if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'manager')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        const { password: _, ...userWithoutPass } = newUser.toObject();
        return NextResponse.json(userWithoutPass, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
