import { apiHandler } from '@/lib/api-handler';
import { NotificationService } from '@/services/notificationService';
import { getCurrentUser } from '@/lib/auth';

export const PATCH = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { ids } = await req.json();
    return await NotificationService.markRead(user.userId, ids, ids === 'all');
});
