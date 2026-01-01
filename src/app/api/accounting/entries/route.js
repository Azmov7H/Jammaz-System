import { apiHandler } from '@/lib/api-handler';
import { AccountingService } from '@/lib/services/accountingService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await AccountingService.getEntries(query);
});
