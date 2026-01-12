import { apiHandler } from '@/lib/api-handler';
import { ReportingService } from '@/services/reportingService';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') throw 'Unauthorized';

    return await ReportingService.getDebtMaturityReport();
});
