import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StockMovement from '@/models/StockMovement';
import Product from '@/models/Product'; // Ensure populated model registered

export async function GET(request) {
    try {
        await dbConnect();
        const movements = await StockMovement.find({})
            .populate('productId', 'name code')
            .populate('createdBy', 'name')
            .sort({ date: -1 })
            .limit(100);
        return NextResponse.json(movements);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
