import { apiHandler } from '@/lib/core/api-handler';
import { DebtService } from '@/lib/services/financial/debtService';

export const GET = apiHandler(async () => {
    return await DebtService.getDebtOverview();
});
