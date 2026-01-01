import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/lib/services/treasuryService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : new Date();
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : new Date();
    const type = searchParams.get('type');

    return await TreasuryService.getTransactions(startDate, endDate, type);
});
