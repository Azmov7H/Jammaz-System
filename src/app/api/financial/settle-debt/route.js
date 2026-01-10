import { apiHandler } from '@/lib/core/api-handler';
import { FinanceService } from '@/lib/services/financeService';
import { getCurrentUser } from '@/lib/core/auth';
import { z } from 'zod';

const settleDebtSchema = z.object({
    type: z.enum(['receivable', 'payable']),
    id: z.string().min(1),
    amount: z.number().positive(),
    method: z.enum(['cash', 'bank']).optional().default('cash'),
    note: z.string().optional().default('')
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const body = await req.json();
    const validated = settleDebtSchema.parse(body);

    const result = await FinanceService.settleDebt(validated, user.userId);
    return result;
});
