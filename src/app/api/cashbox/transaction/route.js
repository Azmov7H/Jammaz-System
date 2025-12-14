import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AccountingService } from '@/lib/services/accountingService';
import { TreasuryService } from '@/lib/services/treasuryService';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { type, amount, description, category } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'المبلغ غير صحيح' }, { status: 400 });
        }

        let entry;

        if (type === 'income') {
            // Create accounting entry
            entry = await AccountingService.createIncomeEntry(amount, description, user.userId);
            // Update treasury/cashbox
            // Note: TreasuryService handles tracking daily totals
        } else if (type === 'expense') {
            if (!category) {
                return NextResponse.json({ error: 'تصنيف المصروف مطلوب' }, { status: 400 });
            }
            entry = await AccountingService.createExpenseEntry(amount, category, description, user.userId);
        } else {
            return NextResponse.json({ error: 'نوع العملية غير صحيح' }, { status: 400 });
        }

        return NextResponse.json({ success: true, entry });

    } catch (error) {
        console.error('Cashbox Transaction Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
