import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);

        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { ids } = await request.json(); // Array of IDs, single ID string, or 'all'

        if (ids === 'all') {
            await Notification.updateMany(
                { $or: [{ userId: decoded.userId }, { userId: null }], isRead: false },
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

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
