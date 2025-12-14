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

        // Auth check for updates
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, status } = body;

        if (status === 'RECEIVED') {
            const po = await PurchaseOrder.findById(id).populate('items.productId');
            if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 });
            if (po.status === 'RECEIVED') return NextResponse.json({ error: 'Already received' }, { status: 400 });

            // 1. Update Stock (AVCO)
            try {
                const { StockService } = await import('@/lib/services/stockService');
                await StockService.increaseStockForPurchase(po.items, po._id, decoded.userId);
            } catch (stockErr) {
                console.error('Stock update error:', stockErr);
                return NextResponse.json({ error: `Stock Update Failed: ${stockErr.message}` }, { status: 500 });
            }

            po.status = 'RECEIVED';
            po.receivedDate = new Date();
            po.paymentType = body.paymentType || 'cash';
            await po.save();

            const paymentType = po.paymentType;

            // 2. Accounting Entries
            try {
                const { AccountingService } = await import('@/lib/services/accountingService');
                await AccountingService.createPurchaseEntries(po, decoded.userId, paymentType);
            } catch (accErr) {
                console.error('Accounting entry error:', accErr);
                // Non-blocking but should be logged
            }

            // 3. Financial Handling
            if (paymentType === 'cash') {
                // CASH PURCHASE: Record Expense in Treasury
                try {
                    const { TreasuryService } = await import('@/lib/services/treasuryService');
                    await TreasuryService.recordPurchaseExpense(po, decoded.userId);
                } catch (treasuryErr) {
                    console.error('Treasury error:', treasuryErr);
                }
            } else if (paymentType === 'bank') {
                // BANK PURCHASE: No impact on physical cashbox
            } else {
                // CREDIT PURCHASE: Increase Supplier Balance (Liability)
                if (po.supplier) {
                    const supplier = await Supplier.findById(po.supplier);
                    if (supplier) {
                        supplier.balance = (supplier.balance || 0) + po.totalCost;
                        supplier.lastSupplyDate = new Date();
                        await supplier.save();
                    }
                }
            }

            return NextResponse.json({ success: true, po });
        }

        return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
