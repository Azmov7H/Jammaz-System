import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import StockMovement from '@/models/StockMovement';
import { StockService } from '@/lib/services/stockService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        let userId = null;
        if (token) {
            const decoded = verifyToken(token);
            userId = decoded?.userId;
        }

        const body = await request.json();
        const { productId, type, qty, note } = body;

        // Validate
        if (!productId || !type || !qty) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Create Movement via Service
        const movement = await StockService.updateStock(
            productId,
            Number(qty),
            type,
            note || 'Manual Adjustment',
            null,
            userId
        );

        return NextResponse.json(movement, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
