import { apiHandler } from '@/lib/api-handler';
import { DebtService } from '@/services/financial/debtService';
import { getCurrentUser } from '@/lib/auth';

export const PATCH = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    const body = await req.json();

    const debt = await DebtService.updateDebt(id, body);
    return debt;
});
