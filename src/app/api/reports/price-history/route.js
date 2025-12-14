import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PriceHistory from '@/models/PriceHistory';
import User from '@/models/User'; // Ensure User model is registered
import Product from '@/models/Product'; // Ensure Product model is registered

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;
        const productId = searchParams.get('productId');

        const query = {};
        if (productId) query.productId = productId;

        const history = await PriceHistory.find(query)
            .sort({ date: -1 })
            .limit(limit)
            .populate('productId', 'name code')
            .populate('changedBy', 'name')
            .lean();

        return NextResponse.json({ history });

    } catch (error) {
        console.error('Price History Error:', error);
        return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 });
    }
}
