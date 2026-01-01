import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { NotificationService } from '@/lib/services/notificationService';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (request) => {
    await dbConnect();

    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Trigger sync in the background (Non-blocking)
    NotificationService.syncAllAlerts().catch(err => {
        console.error('Background Notification Sync Failed:', err);
    });

    // Fetch notifications for this user OR system-wide (null userId)
    const notifications = await Notification.find({
        $or: [{ userId: user.userId }, { userId: null }]
    })
        .sort({ createdAt: -1 })
        .limit(20);

    return { notifications };
});

export const POST = apiHandler(async (request) => {
    await dbConnect();
    const body = await request.json();
    const notification = await Notification.create(body);
    return notification;
});

export const DELETE = apiHandler(async (request) => {
    await dbConnect();
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Delete all notifications for this user OR system-wide
    await Notification.deleteMany({
        $or: [{ userId: user.userId }, { userId: null }]
    });

    return { message: 'All notifications deleted' };
});
