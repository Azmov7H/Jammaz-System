import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { TreasuryService } from '@/lib/services/treasuryService';
import { AccountingService } from '@/lib/services/accountingService';

export async function POST(req) {
    try {
        await dbConnect();
        const { amount, reason, category, date, userId } = await req.json();

        if (!amount || !reason || !category) {
            return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
        }

        // 1. Record in Treasury/Cashbox
        await TreasuryService.addManualExpense(
            date || new Date(),
            parseFloat(amount),
            reason,
            category,
            userId || 'system'
        );

        // 2. Accounting Entry (Operating Expense)
        await AccountingService.createManualEntry({
            date: date || new Date(),
            type: 'EXPENSE',
            amount: parseFloat(amount),
            description: reason,
            category: category,
            userId: userId || 'system'
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Expense API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
