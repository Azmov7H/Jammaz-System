import { apiHandler } from '@/lib/core/api-handler';
import { NotificationService } from '@/lib/services/notificationService';
import { getCurrentUser } from '@/lib/core/auth';

export const PATCH = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { ids } = await req.json();
    return await NotificationService.markRead(user.userId, ids, ids === 'all');
});
