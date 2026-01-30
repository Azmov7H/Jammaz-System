import { apiHandler } from '@/lib/api-handler';
import { FinanceService } from '@/services/financeService';
import { z } from 'zod';

const settleDebtSchema = z.object({
    type: z.enum(['receivable', 'payable']),
    id: z.string().min(1),
    amount: z.number().positive(),
    method: z.enum(['cash', 'bank']).optional().default('cash'),
    note: z.string().optional().default('')
});

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = settleDebtSchema.parse(body);

    return await FinanceService.settleDebt(validated, req.user.userId);
}, { auth: true });
