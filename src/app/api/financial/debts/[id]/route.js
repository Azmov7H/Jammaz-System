import { apiHandler } from '@/lib/api-handler';
import { DebtService } from '@/services/financial/debtService';

export const PATCH = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const body = await req.json();
    return await DebtService.updateDebt(id, body);
}, { auth: true });
