import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { StockService } from '@/lib/services/stockService';

/**
 * Get stock movements
 */
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);

        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const type = searchParams.get('type');

        const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = endDateStr ? new Date(endDateStr) : new Date();

        const movements = await StockService.getMovements(startDate, endDate, type);

        return NextResponse.json({ movements });
    } catch (error) {
        console.error('Stock movements error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
