import { apiHandler } from '@/lib/api-handler';
import { PurchaseOrderService } from '@/services/purchaseOrderService';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const purchaseOrder = await PurchaseOrderService.getById(id);

    if (!purchaseOrder) {
        throw 'أمر الشراء غير موجود';
    }

    return { purchaseOrder };
});

export const PATCH = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    const body = await req.json();

    const purchaseOrder = await PurchaseOrderService.updateStatus(id, body, user.userId);
    return {
        message: body.status === 'RECEIVED' ? 'تم استلام الطلب وتحديث المخزون والحسابات' : 'تم تحديث حالة الطلب',
        purchaseOrder
    };
});

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    return await PurchaseOrderService.delete(id);
});
