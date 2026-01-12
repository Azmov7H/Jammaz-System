import { apiHandler } from '@/lib/api-handler';
import { AccountingService } from '@/services/accountingService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') ? new Date(searchParams.get('date')) : new Date();
    return await AccountingService.getTrialBalance(date);
});
