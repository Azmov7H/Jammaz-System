import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
// Ensure models are registered
import Customer from '@/models/Customer';
import User from '@/models/User';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const invoice = await Invoice.findById(id)
            .populate('customer')
            .populate('createdBy', 'name')
            .lean();

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Hydrate product names if not stored in invoice (optimization: usually we should store name in invoice for history, but if not, populate)
        // Check if items have names. My invoice creation logic stored basic info.
        // Let's populate product details to be safe.
        // Actually, schema has productId reference.

        // Manual population for items to get current names if needed, 
        // OR better yet, let's assume we want to show the name at time of sale? 
        // My POST route stored item.qty, item.unitPrice. It didn't strictly store the name in the items array in Schema.
        // Wait, Invoice.js schema definition:
        // items: [{ productId: Ref, qty, unitPrice, total }]
        // It DOES NOT have 'name'. 
        // So I MUST populate the product names here.

        const populatedInvoice = await Invoice.findById(id)
            .populate('customer')
            .populate('createdBy', 'name')
            .populate({
                path: 'items.productId',
                select: 'name'
            })
            .lean();

        // Transform items to include name at top level of item object for frontend convenience
        populatedInvoice.items = populatedInvoice.items.map(item => ({
            ...item,
            name: item.productId?.name || 'Unknown Product',
            productId: item.productId?._id
        }));

        return NextResponse.json({ invoice: populatedInvoice });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
