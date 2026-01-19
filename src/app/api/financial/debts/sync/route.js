import { apiHandler } from '@/lib/api-handler';
import { DebtService } from '@/services/financial/debtService';
import { getCurrentUser } from '@/lib/auth';

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const body = await req.json();
    const { debtorId, debtorType } = body;

    if (!debtorId || !debtorType) {
        throw 'debtorId and debtorType are required';
    }

    return await DebtService.syncDebts(debtorId, debtorType);
});
