import { apiHandler } from '@/lib/api-handler';
import { PhysicalInventoryService } from '@/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';

export const POST = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    const result = await PhysicalInventoryService.completeCount(id, user.userId);

    return {
        count: result.count,
        adjustments: result.adjustments,
        message: `تم اعتماد الجرد بنجاح. تم إجراء ${result.totalAdjustments} تعديل`
    };
});
