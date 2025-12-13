import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PurchaseOrder from '@/models/PurchaseOrder';
import Product from '@/models/Product';
import Supplier from '@/models/Supplier';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: List POs
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || 20;

        const pos = await PurchaseOrder.find({})
            .populate('supplier', 'name')
            .populate('items.productId', 'name code')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        return NextResponse.json({ purchaseOrders: pos });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch POs' }, { status: 500 });
    }
}

// POST: Create PO
export async function POST(request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { supplierId, items, notes, expectedDate } = body;

        let totalCost = 0;
        items.forEach(item => {
            totalCost += item.quantity * item.costPrice;
        });

        const po = await PurchaseOrder.create({
            poNumber: `PO-${Date.now()}`,
            supplier: supplierId,
            items,
            totalCost,
            expectedDate,
            notes,
            createdBy: decoded.userId
        });

        return NextResponse.json(po, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create PO' }, { status: 500 });
    }
}

// PUT: Receive / Update PO
export async function PUT(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { id, status } = body; // action: 'RECEIVE' logic could be here

        if (status === 'RECEIVED') {
            const po = await PurchaseOrder.findById(id);
            if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 });
            if (po.status === 'RECEIVED') return NextResponse.json({ error: 'Already received' }, { status: 400 });

            // Update Stock
            const bulkOps = po.items.map(item => ({
                updateOne: {
                    filter: { _id: item.productId },
                    update: [
                        { $set: { warehouseQty: { $add: ["$warehouseQty", item.quantity] } } }, // Add to Warehouse
                        { $set: { stockQty: { $add: ["$warehouseQty", "$shopQty"] } } }, // Recalc Total
                        { $set: { buyPrice: item.costPrice } } // Update latest cost
                    ]
                }
            }));

            await Product.bulkWrite(bulkOps);

            po.status = 'RECEIVED';
            po.receivedDate = new Date();
            await po.save();

            // Treasury Transaction (Expense)
            const { processTreasuryTransaction } = await import('@/lib/treasury');
            await processTreasuryTransaction({
                amount: po.totalCost,
                type: 'EXPENSE',
                description: `أمر شراء #${po.poNumber} - ${po.supplier?.name || ''}`,
                referenceType: 'PurchaseOrder',
                referenceId: po._id,
                userId: null // System action or need to decode token similarly if not passed
            });
            return NextResponse.json({ success: true, po });
        }

        // Generic update if needed (e.g. cancelling)
        // ...

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
