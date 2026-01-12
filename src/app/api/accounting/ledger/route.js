import { apiHandler } from '@/lib/api-handler';
import { AccountingService } from '@/services/accountingService';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const account = searchParams.get('account');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!account) {
        return NextResponse.json({ success: false, error: 'Account Name is required' }, { status: 400 });
    }

    return await AccountingService.getLedger(account, startDate, endDate);
});
