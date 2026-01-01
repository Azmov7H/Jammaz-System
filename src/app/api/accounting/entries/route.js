import { apiHandler } from '@/lib/api-handler';
import { AccountingService, ACCOUNTS } from '@/lib/services/accountingService';
import { TreasuryService } from '@/lib/services/treasuryService';
import AccountingEntry from '@/models/AccountingEntry';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await AccountingService.getEntries(query);
});

export const POST = apiHandler(async (req) => {
    await dbConnect();
    const user = await getCurrentUser();
    if (!user) throw new Error('غير مصرح لك');

    const body = await req.json();
    const { debitAccount, creditAccount, amount, description, type, date } = body;

    // 1. Create the accounting entry
    const entry = await AccountingEntry.createEntry({
        type: type || 'EXPENSE',
        debitAccount,
        creditAccount,
        amount: Number(amount),
        description,
        userId: user.userId,
        refType: 'Manual',
        date: date ? new Date(date) : new Date()
    });

    // 2. Sync with Treasury if Cash is involved
    // If Cash is Debited -> INCOME
    if (debitAccount === ACCOUNTS.CASH) {
        await TreasuryService.updateDailyCashbox(entry.date, { salesIncome: entry.amount });
    }
    // If Cash is Credited -> EXPENSE
    else if (creditAccount === ACCOUNTS.CASH) {
        await TreasuryService.updateDailyCashbox(entry.date, { purchaseExpenses: entry.amount });
    }

    return { entry };
});
