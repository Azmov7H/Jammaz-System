import { apiHandler } from '@/lib/api-handler';
import { FinanceService } from '@/services/financeService';
import { expenseSchema } from '@/validations/validators';

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const validated = expenseSchema.parse(body);
    return await FinanceService.recordExpense(validated, req.user.userId);
}, { auth: true });
