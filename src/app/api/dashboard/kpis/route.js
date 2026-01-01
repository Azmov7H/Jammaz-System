import { apiHandler } from '@/lib/api-handler';
import { DashboardService } from '@/lib/services/dashboardService';

export const GET = apiHandler(async () => {
    return await DashboardService.getKPIs();
});
