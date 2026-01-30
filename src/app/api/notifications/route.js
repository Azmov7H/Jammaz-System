import { apiHandler } from '@/lib/api-handler';
import { NotificationService } from '@/services/notificationService';

export const GET = apiHandler(async (req) => {
    // Trigger background sync (scanners)
    await NotificationService.syncAllAlerts();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    return await NotificationService.getUserNotifications(req.user.userId, {
        page,
        limit,
        unreadOnly
    });
}, { auth: true });
