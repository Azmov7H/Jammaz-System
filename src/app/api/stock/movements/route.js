import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import { StockService } from '@/services/stockService';

/**
 * Get stock movements
 */
export const GET = apiHandler(async (request) => {
    const { searchParams } = new URL(request.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const type = searchParams.get('type');

    const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    const movements = await StockService.getMovements(startDate, endDate, type);

    return { movements };
}, { auth: true });
