import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getCurrentUser } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export const GET = apiHandler(async (req) => {
    const user = await getCurrentUser();

    // Quick fetch with limit 1 just to get unreadCount from the service response
    // Or we could optimize service to have specific count method. 
    // Reusing existing method for now as it returns unreadCount efficiently enough (counts indexes).
    const { unreadCount } = await NotificationService.getUserNotifications(user._id, { limit: 1 });

    return NextResponse.json({
        success: true,
        data: { unreadCount }
    });
});
