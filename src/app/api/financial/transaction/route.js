import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/services/treasuryService';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : new Date();
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : new Date();
    const type = searchParams.get('type');

    if (!searchParams.get('startDate')) {
        startDate.setDate(startDate.getDate() - 30); // Default 30 days for dedicated transaction view
    }

    return await TreasuryService.getTransactions(startDate, endDate, type);
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('غير مصرح لك');

    const { amount, description, type, category } = await req.json();

    if (type === 'INCOME') {
        return await TreasuryService.addManualIncome(new Date(), Number(amount), description, user.userId);
    } else if (type === 'EXPENSE') {
        return await TreasuryService.addManualExpense(new Date(), Number(amount), description, category || 'others', user.userId);
    } else {
        throw new Error('نوع معاملة غير معروف');
    }
});
