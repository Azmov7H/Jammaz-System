import { apiHandler } from '@/lib/api-handler';
import { PurchaseOrderService } from '@/lib/services/purchaseOrderService';
import { poReceiveSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const purchaseOrder = await PurchaseOrderService.getById(id);

    if (!purchaseOrder) {
        return NextResponse.json({ success: false, error: 'أمر الشراء غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { purchaseOrder } });
});

export const PATCH = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Using poReceiveSchema if status is RECEIVED, else partial? 
    // Actually, poReceiveSchema is good for receiving. Let's make it flexible or just parse status first.
    const status = body.status;

    try {
        const purchaseOrder = await PurchaseOrderService.updateStatus(id, body, user.userId);
        return NextResponse.json({
            success: true,
            message: status === 'RECEIVED' ? 'تم استلام الطلب وتحديث المخزون والحسابات' : 'تم تحديث حالة الطلب',
            data: { purchaseOrder }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: typeof error === 'string' ? error : 'خطأ أثناء تحديث أمر الشراء'
        }, { status: 400 });
    }
});

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    return await PurchaseOrderService.delete(id);
});
