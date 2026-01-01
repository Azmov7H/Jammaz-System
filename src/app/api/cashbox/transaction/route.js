import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import { AccountingService } from '@/lib/services/accountingService';
import { TreasuryService } from '@/lib/services/treasuryService';
import { getCurrentUser } from '@/lib/auth';

export const POST = apiHandler(async (req) => {
    await dbConnect();
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const body = await req.json();
    const { type, amount, description, category } = body;

    if (!amount || amount <= 0) {
        throw new Error('المبلغ غير صحيح');
    }

    if (type === 'income') {
        // Primary flow via TreasuryService for consistency in logs
        return await TreasuryService.addManualIncome(new Date(), Number(amount), description, user.userId);
    } else if (type === 'expense') {
        if (!category) throw new Error('تصنيف المصروف مطلوب');
        return await TreasuryService.addManualExpense(new Date(), Number(amount), description, category, user.userId);
    } else {
        throw new Error('نوع العملية غير صحيح');
    }
});
