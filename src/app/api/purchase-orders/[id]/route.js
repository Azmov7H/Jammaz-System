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
            try {
                // Increase stock in warehouse
                await StockService.increaseStockForPurchase(
                    purchaseOrder.items,
                    purchaseOrder._id,
                    user.userId
                );

                // Record expense in treasury
                await TreasuryService.recordPurchaseExpense(purchaseOrder, user.userId);

                // Update PO status
                purchaseOrder.status = 'RECEIVED';
                purchaseOrder.receivedDate = new Date();
                await purchaseOrder.save();

                return NextResponse.json({
                    message: 'تم استلام الطلب وتحديث المخزون والخزينة',
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
