import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request, { params }) {
    try {
        await dbConnect();

        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Delete single notification
        const result = await Notification.findByIdAndDelete(id);

        if (!result) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}
