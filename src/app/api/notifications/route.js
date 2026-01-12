import { apiHandler } from '@/lib/api-handler';
import { NotificationService } from '@/services/notificationService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // Trigger background sync (scanners)
    // We don't await this to keep the response fast, or we can await it if we want fresh data
    // Usually syncAllAlerts has a 5-min cache internally
    await NotificationService.syncAllAlerts();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    return await NotificationService.getUserNotifications(user.userId, {
        page,
        limit,
        unreadOnly
    });
});
