import { apiHandler } from '@/lib/core/api-handler';
import { ReportingService } from '@/lib/services/reportingService';
import { getCurrentUser } from '@/lib/core/auth';

export const GET = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') throw 'Unauthorized';

    return await ReportingService.getDebtMaturityReport();
});
