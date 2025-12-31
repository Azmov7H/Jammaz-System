import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Supplier from '@/models/Supplier';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { CACHE_TAGS } from '@/lib/cache';

// GET: List all suppliers
export async function GET() {
    try {
        await dbConnect();
        // Use cached method for speed
        const suppliers = await Supplier.getAllCached({});
        return NextResponse.json(suppliers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}

// POST: Create a new supplier
export async function POST(req) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, phone, address, email, financialTrackingEnabled, paymentDay, supplyTerms } = body;

        if (!name) return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });

        const newSupplier = await Supplier.create({
            name, phone, address, email,
            financialTrackingEnabled: financialTrackingEnabled !== undefined ? financialTrackingEnabled : true,
            paymentDay: paymentDay || 'None',
            supplyTerms: supplyTerms || 0
        });

        // Revalidate cache
        revalidateTag(CACHE_TAGS.SUPPLIERS);

        return NextResponse.json(newSupplier, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
    }
}

// PUT: Update a supplier
export async function PUT(req) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { _id, name, phone, address, email, financialTrackingEnabled, paymentDay, supplyTerms } = body;

        if (!_id) return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });

        const updatedSupplier = await Supplier.findByIdAndUpdate(
            _id,
            { name, phone, address, email, financialTrackingEnabled, paymentDay, supplyTerms },
            { new: true }
        );

        // Revalidate cache
        revalidateTag(CACHE_TAGS.SUPPLIERS);
        revalidateTag(`supplier-${_id}`);

        return NextResponse.json(updatedSupplier);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    }
}
