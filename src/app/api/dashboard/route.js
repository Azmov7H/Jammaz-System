import { apiHandler } from '@/lib/api-handler';
import { DashboardService } from '@/services/dashboardService';
import { unstable_cache } from 'next/cache';

// Server-side cache for 60 seconds to reduce DB load
const getCachedDashboard = unstable_cache(
    async () => DashboardService.getUnifiedData(),
    ['dashboard-unified-data'],
    { revalidate: 60 }
);

export const GET = apiHandler(async () => {
    return await getCachedDashboard();
}, { auth: true });
