import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { StockService } from '@/services/stockService';
import { getCurrentUser } from '@/lib/auth';

// Force Update Comment - Fixed duplicates
export async function POST(request) {
    try {
        await dbConnect();

        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // TODO: Strict permission check (role === manager/warehouse)

        const { productId, quantity, from, to } = await request.json();

        let type = '';
        if (from === 'warehouse' && to === 'shop') {
            type = 'TRANSFER_TO_SHOP';
        } else if (from === 'shop' && to === 'warehouse') {
            type = 'TRANSFER_TO_WAREHOUSE';
        } else {
            return NextResponse.json({ error: 'Invalid transfer direction' }, { status: 400 });
        }

        const result = await StockService.moveStock({
            productId,
            qty: quantity,
            type,
            userId: user.userId,
            note: `Transfer: ${from} -> ${to}`
        });

        return NextResponse.json({ success: true, product: result });

    } catch (error) {
        console.error('Transfer Error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
