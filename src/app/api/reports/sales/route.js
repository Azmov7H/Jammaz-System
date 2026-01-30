import { apiHandler } from '@/lib/api-handler';
import { DailySalesService } from '@/services/dailySalesService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : new Date();

    return await DailySalesService.getSalesSummary(startDate, endDate);
}, { auth: true });
