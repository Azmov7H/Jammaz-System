import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/services/treasuryService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (date) {
        return await TreasuryService.getDailyCashbox(new Date(date));
    } else if (startDateParam && endDateParam) {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);

        // Ensure endDate covers the whole day
        endDate.setHours(23, 59, 59, 999);

        const transactions = await TreasuryService.getTransactions(startDate, endDate);

        // Calculate totals for this period
        const totals = transactions.reduce((acc, tx) => {
            if (tx.type === 'INCOME') acc.income += tx.amount;
            if (tx.type === 'EXPENSE') acc.expense += tx.amount;
            return acc;
        }, { income: 0, expense: 0 });

        // For a range, we still want the current overall balance for the header
        const currentBalance = await TreasuryService.getCurrentBalance();

        return {
            balance: currentBalance,
            periodBalance: totals.income - totals.expense,
            totalIncome: totals.income,
            totalExpense: totals.expense,
            transactions
        };
    } else {
        // Return current balance and last 7 days transactions by default
        const balance = await TreasuryService.getCurrentBalance();

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const transactions = await TreasuryService.getTransactions(startDate, endDate);

        return {
            balance,
            transactions
        };
    }
}, { auth: true });
