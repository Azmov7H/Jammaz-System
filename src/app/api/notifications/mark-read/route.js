import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export const PUT = apiHandler(async (request) => {
    await dbConnect();
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const { ids } = await request.json(); // Array of IDs, single ID string, or 'all'

    if (ids === 'all') {
        await Notification.updateMany(
            { $or: [{ userId: user.userId }, { userId: null }], isRead: false },
            { isRead: true }
        );
    } else if (Array.isArray(ids)) {
        await Notification.updateMany(
            { _id: { $in: ids } },
            { isRead: true }
        );
    } else {
        // Single ID as string
        await Notification.findByIdAndUpdate(ids, { isRead: true });
    }

    return { success: true };
});
