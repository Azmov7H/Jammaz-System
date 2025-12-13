import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth'; // Access control if needed

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
