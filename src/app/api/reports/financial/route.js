import { apiHandler } from '@/lib/api-handler';
import { ReportingService } from '@/lib/services/reportingService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : startOfMonth;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : new Date();

    return await ReportingService.getFinancialReport(startDate, endDate);
});
