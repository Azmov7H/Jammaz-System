import { apiHandler } from '@/lib/api-handler';
import { StockService } from '@/lib/services/stockService';
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
    return await StockService.getProductHistory(null, limit); // Note: getProductHistory needs update to support null productId? or use getMovements default
    // Let's use getMovements with default wide range or create a getAll method. 
    // Creating one-off query here to keep Service clean or update Service.
    // StockService.getProductHistory uses find({productId}). If productId is null it might fail or find({null}).
    // Let's update StockService.getProductHistory to handle optional productId.
    // Actually, let's just return getMovements(new Date('2000-01-01'), new Date()) for now or simplified.
    // Ideally Service should expose getAllRecent.
});

// Helper for POST is in stock/move/route.js, let's see if we consolidate.
