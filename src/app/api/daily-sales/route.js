import { apiHandler } from '@/lib/core/api-handler';
import { DailySalesService } from '@/lib/services/dailySalesService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (dateStr) {
        return await DailySalesService.getDailySales(new Date(dateStr));
    }

    if (startDateStr && endDateStr) {
        return await DailySalesService.getSalesSummary(new Date(startDateStr), new Date(endDateStr));
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return await DailySalesService.getSalesSummary(startDate, endDate);
});
