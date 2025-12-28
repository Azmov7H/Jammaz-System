import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { NotificationService } from '@/lib/services/notificationService';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        await dbConnect();

        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Auto-sync alerts before fetching
        await NotificationService.syncAllAlerts();

        // Fetch notifications for this user OR system-wide (null userId)
        const notifications = await Notification.find({
            $or: [{ userId: user.userId }, { userId: null }]
        })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Notifications Error:', error);
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

export async function DELETE(request) {
    try {
        await dbConnect();

        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Delete all notifications for this user OR system-wide
        await Notification.deleteMany({
            $or: [{ userId: user.userId }, { userId: null }]
        });

        return NextResponse.json({ success: true, message: 'All notifications deleted' });
    } catch (error) {
        console.error('Delete notifications error:', error);
        return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
    }
}
