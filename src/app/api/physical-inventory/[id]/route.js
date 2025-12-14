import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PhysicalInventoryService } from '@/lib/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const count = await PhysicalInventoryService.getCountById(id);

        if (!count) {
            return NextResponse.json({ error: 'سجل الجرد غير موجود' }, { status: 404 });
        }

        return NextResponse.json({ count });

    } catch (error) {
        console.error('Error fetching physical count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update actual quantities
export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { items } = body;

        const count = await PhysicalInventoryService.updateActualQuantities(id, items, user.userId);

        return NextResponse.json({ count, success: true });

    } catch (error) {
        console.error('Error updating count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete a draft count
export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await PhysicalInventoryService.deleteCount(id, user.userId);

        return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' });

    } catch (error) {
        console.error('Error deleting count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
