import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PurchaseOrder from '@/models/PurchaseOrder';
import Product from '@/models/Product';
import Supplier from '@/models/Supplier';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import InvoiceSettings from '@/models/InvoiceSettings';

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
        const { supplierId, items, notes } = body;
        let { expectedDate } = body;

        // Auto-set Expected Date if missing
        if (!expectedDate) {
            let terms = 0;

            // Check for supplier-specific terms
            if (supplier) {
                const sup = await Supplier.findById(supplier);
                if (sup && sup.supplyTerms > 0) {
                    terms = sup.supplyTerms;
                }
            }

            // Fallback to global settings
            if (terms === 0) {
                const settings = await InvoiceSettings.getSettings();
                terms = settings.defaultSupplierTerms || 15;
            }

            const date = new Date();
            date.setDate(date.getDate() + terms);
            expectedDate = date;
        }

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

            // 1. Execute Business Logic via centralized FinanceService
            try {
                const { FinanceService } = await import('@/lib/services/financeService');
                await FinanceService.recordPurchaseReceive(po, decoded.userId, body.paymentType || 'cash');
            } catch (procErr) {
                console.error('❌ Post-Purchase Processing Error:', procErr);
                return NextResponse.json({
                    warning: 'تم استلام الطلب ولكن حدث خطأ في تحديث البيانات المالية',
                    po,
                    error: procErr.message
                }, { status: 201 });
            }

            return NextResponse.json({ success: true, po });
        }

        return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
