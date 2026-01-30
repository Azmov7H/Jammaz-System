import { apiHandler } from '@/lib/api-handler';
import { DebtService } from '@/services/financial/debtService';

export const GET = apiHandler(async () => {
    return await DebtService.getDebtOverview();
}, { auth: true });
