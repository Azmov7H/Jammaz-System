import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PurchaseOrder from '@/models/PurchaseOrder';
import { StockService } from '@/lib/services/stockService';
import { TreasuryService } from '@/lib/services/treasuryService';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const purchaseOrder = await PurchaseOrder.findById(id)
            .populate('supplier', 'name phone address')
            .populate('items.productId', 'name code');

        if (!purchaseOrder) {
            return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
        }

        return NextResponse.json({ purchaseOrder });
    } catch (error) {
        console.error('PO GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 });
    }
}

/**
 * Update Purchase Order Status - especially RECEIVING
 */
export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { status } = await request.json();

        const purchaseOrder = await PurchaseOrder.findById(id).populate('items.productId');

        if (!purchaseOrder) {
            return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
        }

        // If marking as RECEIVED, execute business logic
        if (status === 'RECEIVED' && purchaseOrder.status !== 'RECEIVED') {
            // Execute business logic via FinanceService
            const { FinanceService } = await import('@/lib/services/financeService');
            // Note: Patch route doesn't specify paymentType in the body in the original code, 
            // but usually POs are cash or credit. We'll default to cash for this quick patch if not specified.
            await FinanceService.recordPurchaseReceive(purchaseOrder, user.userId, 'cash');

            return NextResponse.json({
                message: 'تم استلام الطلب وتحديث المخزون والخزينة والحسابات',
                purchaseOrder
            });

        } catch (businessLogicError) {
            console.error('❌ PO Receiving Error:', businessLogicError);
            return NextResponse.json({
                error: 'فشل في معالجة الاستلام',
                details: businessLogicError.message
            }, { status: 500 });
        }
    }

        // Other status updates
        purchaseOrder.status = status;
    await purchaseOrder.save();

    return NextResponse.json({ purchaseOrder });

} catch (error) {
    console.error('PO PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
}
}
