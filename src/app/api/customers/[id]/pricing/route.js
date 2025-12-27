import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PricingService } from '@/lib/services/pricingService';
import Customer from '@/models/Customer';

// GET all custom prices for a customer
export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const prices = await PricingService.getCustomerPricing(id);
        return NextResponse.json({ prices });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST set a custom price
export async function POST(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { productId, price } = await request.json();

        const customer = await PricingService.setCustomPrice(id, productId, price);
        return NextResponse.json({ success: true, customer });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE remove a custom price
export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const customer = await PricingService.removeCustomPrice(id, productId);
        return NextResponse.json({ success: true, customer });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
