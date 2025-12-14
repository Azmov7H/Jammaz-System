import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PhysicalInventoryService } from '@/lib/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';

// Complete a physical count and generate adjustments
export async function POST(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const result = await PhysicalInventoryService.completeCount(id, user.userId);

        return NextResponse.json({
            success: true,
            count: result.count,
            adjustments: result.adjustments,
            message: `تم اعتماد الجرد بنجاح. تم إجراء ${result.totalAdjustments} تعديل`
        });

    } catch (error) {
        console.error('Error completing count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
