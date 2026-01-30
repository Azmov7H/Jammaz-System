import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/services/treasuryService';

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const { type, amount, description, category } = body;

    if (!amount || amount <= 0) {
        throw 'المبلغ غير صحيح';
    }

    if (type === 'income') {
        // Primary flow via TreasuryService for consistency in logs
        return await TreasuryService.addManualIncome(new Date(), Number(amount), description, req.user.userId);
    } else if (type === 'expense') {
        if (!category) throw 'تصنيف المصروف مطلوب';
        return await TreasuryService.addManualExpense(new Date(), Number(amount), description, category, req.user.userId);
    } else {
        throw 'نوع العملية غير صحيح';
    }
}, { auth: true });
