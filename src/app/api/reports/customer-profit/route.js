import { apiHandler } from '@/lib/api-handler';
import { ReportingService } from '@/services/reportingService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : null;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : null;

    const report = await ReportingService.getCustomerProfitReport(startDate, endDate);
    return { report };
}, { roles: ['owner'] });
