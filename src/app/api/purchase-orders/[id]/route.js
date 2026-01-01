import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import PurchaseOrder from '@/models/PurchaseOrder';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req, { params }) => {
    await dbConnect();
    const { id } = await params;

    const purchaseOrder = await PurchaseOrder.findById(id)
        .populate('supplier', 'name phone address')
        .populate('items.productId', 'name code');

    if (!purchaseOrder) {
        throw new Error('أمر الشراء غير موجود');
    }

    return { purchaseOrder };
});

/**
 * Update Purchase Order Status - especially RECEIVING
 */
export const PATCH = apiHandler(async (req, { params }) => {
    await dbConnect();
    const user = await getCurrentUser();
    if (!user) throw new Error('غير مصرح لك بالقيام بهذه العملية');

    const { id } = await params;
    const { status, paymentType = 'cash' } = await req.json();

    const purchaseOrder = await PurchaseOrder.findById(id).populate('items.productId');

    if (!purchaseOrder) {
        throw new Error('أمر الشراء غير موجود');
    }

    // If marking as RECEIVED, execute business logic
    if (status === 'RECEIVED' && purchaseOrder.status !== 'RECEIVED') {
        const { FinanceService } = await import('@/lib/services/financeService');
        await FinanceService.recordPurchaseReceive(purchaseOrder, user.userId, paymentType);

        // Return updated PO after business logic
        const updatedPO = await PurchaseOrder.findById(id)
            .populate('supplier', 'name phone address')
            .populate('items.productId', 'name code');

        return {
            message: 'تم استلام الطلب وتحديث المخزون والخزينة والحسابات',
            purchaseOrder: updatedPO
        };
    }

    // Other status updates
    purchaseOrder.status = status;
    await purchaseOrder.save();

    return { purchaseOrder };
});
