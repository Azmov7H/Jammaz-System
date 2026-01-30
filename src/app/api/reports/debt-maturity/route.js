import { apiHandler } from '@/lib/api-handler';
import { ReportingService } from '@/services/reportingService';

export const GET = apiHandler(async () => {
    return await ReportingService.getDebtMaturityReport();
}, { roles: ['owner'] });
