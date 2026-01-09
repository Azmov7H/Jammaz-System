import { apiHandler } from '@/lib/api-handler';
import { PhysicalInventoryService } from '@/lib/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const POST = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const result = await PhysicalInventoryService.completeCount(id, user.userId);

    return {
        success: true,
        count: result.count,
        adjustments: result.adjustments,
        message: `تم اعتماد الجرد بنجاح. تم إجراء ${result.totalAdjustments} تعديل`
    };
});
