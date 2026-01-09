import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getCurrentUser } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export const GET = apiHandler(async (req) => {
    const user = await getCurrentUser();

    // Parse query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') || null;

    // Trigger explicit sync if requested (optional, careful with performance)
    // await NotificationService.syncAllAlerts();

    const result = await NotificationService.getUserNotifications(user._id, {
        page,
        limit,
        unreadOnly,
        type
    });

    return NextResponse.json({
        success: true,
        data: result
    });
});
