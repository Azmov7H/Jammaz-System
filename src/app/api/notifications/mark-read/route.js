import { apiHandler } from '@/lib/api-handler';
import { NotificationService } from '@/lib/services/notificationService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const PUT = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { ids } = await req.json(); // Array of IDs, single ID string, or 'all'
    return await NotificationService.markRead(user.userId, ids);
});
