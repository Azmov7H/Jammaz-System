import { apiHandler } from '@/lib/api-handler';
import { FinanceService } from '@/services/financeService';
import { getCurrentUser } from '@/lib/auth';
import { expenseSchema } from '@/validations/validators';
import { NextResponse } from 'next/server';

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = expenseSchema.parse(body);

    try {
        const result = await FinanceService.recordExpense(validated, user.userId);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: typeof error === 'string' ? error : 'خطأ أثناء تسجيل المصروف'
        }, { status: 400 });
    }
});
