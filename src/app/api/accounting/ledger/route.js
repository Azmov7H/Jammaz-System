import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AccountingService } from '@/lib/services/accountingService';
import { getCurrentUser } from '@/lib/auth';

// Get ledger for an account
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);

        const account = searchParams.get('account');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!account) {
            return NextResponse.json({ error: 'اسم الحساب مطلوب' }, { status: 400 });
        }

        const ledger = await AccountingService.getLedger(account, startDate, endDate);

        return NextResponse.json({ ledger });

    } catch (error) {
        console.error('Error fetching ledger:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
