import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/services/treasuryService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (date) {
        return await TreasuryService.getDailyCashbox(new Date(date));
    } else {
        // Return current balance and last 50 transactions for the financial overview
        const balance = await TreasuryService.getCurrentBalance();

        // Get transactions from last 7 days by default if no date specified
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const transactions = await TreasuryService.getTransactions(startDate, endDate);

        return {
            balance,
            transactions
        };
    }
});
