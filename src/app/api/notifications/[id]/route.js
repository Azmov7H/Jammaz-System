import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getCurrentUser } from '@/lib/auth';
import { Notification } from '@/models/Notification'; // Direct access for delete or use Service
import { NotificationService } from '@/lib/services/notificationService'; // I should add delete to service

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    const { id } = params;

    if (id === 'all') {
        // Service doesn't have a specific 'delete all' public method yet, but I can add or just do it here
        const Notification = require('@/models/Notification').default;
        await Notification.deleteMany({ recipientId: user._id });
    } else {
        const Notification = require('@/models/Notification').default;
        await Notification.findOneAndDelete({ _id: id, recipientId: user._id });
    }

    return NextResponse.json({
        success: true,
        data: { message: 'Notification deleted' }
    });
});
