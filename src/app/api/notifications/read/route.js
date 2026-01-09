import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getCurrentUser } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';
import { z } from 'zod';

const markReadSchema = z.object({
    ids: z.union([
        z.array(z.string()),
        z.literal('all')
    ])
});

export const PATCH = apiHandler(async (req) => {
    const user = await getCurrentUser();
    const body = await req.json();

    // Validate
    const { ids } = markReadSchema.parse(body);

    await NotificationService.markRead(user._id, ids, ids === 'all');

    return NextResponse.json({
        success: true,
        data: { message: 'Notifications updated' }
    });
});
