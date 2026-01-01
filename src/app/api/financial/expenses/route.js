import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/lib/services/treasuryService';
import { AccountingService } from '@/lib/services/accountingService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { amount, reason, category, date } = body;

    // 1. Record in Treasury
    await TreasuryService.addManualExpense(
        date || new Date(),
        parseFloat(amount),
        reason,
        category,
        user.userId
    );

    // 2. Record in Accounting
    await AccountingService.createExpenseEntry(
        parseFloat(amount),
        category,
        reason,
        user.userId,
        date || new Date()
    );

    return { success: true };
});
