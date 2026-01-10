import { apiHandler } from '@/lib/core/api-handler';
import { getCurrentUser } from '@/lib/core/auth';
import { NotificationService } from '@/lib/services/notificationService';

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;

    if (id === 'all') {
        return await NotificationService.deleteAll(user.userId);
    } else {
        return await NotificationService.delete(user.userId, id);
    }
});
