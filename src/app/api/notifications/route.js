import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch notifications for this user OR system-wide (null userId)
        const notifications = await Notification.find({
            $or: [{ userId: decoded.userId }, { userId: null }]
        })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({ notifications });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Internal use mostly, but can be exposed
        const notification = await Notification.create(body);

        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
