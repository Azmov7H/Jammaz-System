import { apiHandler } from '@/lib/api-handler';
import { DashboardService } from '@/services/dashboardService';

export const GET = apiHandler(async () => {
    return await DashboardService.getStrategy();
});
