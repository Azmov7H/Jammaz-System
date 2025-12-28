import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PhysicalInventoryService } from '@/lib/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';

// Create new physical count
export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { location, category, isBlind } = body;

        if (!location || !['warehouse', 'shop', 'both'].includes(location)) {
            return NextResponse.json({ error: 'الموقع غير صحيح' }, { status: 400 });
        }

        const count = await PhysicalInventoryService.createCount(location, user.userId, {
            category,
            isBlind
        });

        return NextResponse.json({ count, success: true }, { status: 201 });

    } catch (error) {
        console.error('Error creating physical count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get all counts or filter
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);

        const location = searchParams.get('location');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const counts = await PhysicalInventoryService.getCounts({
            location,
            status,
            startDate,
            endDate
        });

        return NextResponse.json({ counts });

    } catch (error) {
        console.error('Error fetching counts:', error);
        return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
    }
}
