import { apiHandler } from '@/lib/api-handler';
import { StockService } from '@/services/stockService';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (productId) {
        return await StockService.getProductHistory(productId, limit);
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (startDate && endDate) {
        return await StockService.getMovements(new Date(startDate), new Date(endDate));
    }

    // Default latest movements
    return await StockService.getProductHistory(productId, limit);
});

// Helper for POST is in stock/move/route.js, let's see if we consolidate.
// Helper for POST is in stock/move/route.js, let's see if we consolidate.
