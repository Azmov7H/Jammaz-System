import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AccountingService } from '@/lib/services/accountingService';

// Get trial balance
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);

        const asOfDate = searchParams.get('asOfDate');

        const trialBalance = await AccountingService.getTrialBalance(
            asOfDate ? new Date(asOfDate) : new Date()
        );

        return NextResponse.json({ trialBalance });

    } catch (error) {
        console.error('Error fetching trial balance:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
