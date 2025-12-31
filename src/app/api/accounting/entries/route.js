import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AccountingService, ACCOUNTS } from '@/lib/services/accountingService';

// Get all accounting entries
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const type = searchParams.get('type');
        const account = searchParams.get('account');
        const limit = parseInt(searchParams.get('limit') || '100');

        const entries = await AccountingService.getEntries({
            startDate,
            endDate,
            type,
            account,
            limit
        });

        // Get chart of accounts for reference
        const chartOfAccounts = Object.values(ACCOUNTS);

        return NextResponse.json({ entries, chartOfAccounts });

    } catch (error) {
        console.error('Error fetching accounting entries:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
// Create manual entry
export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Basic validation
        if (!body.amount || !body.debitAccount || !body.creditAccount || !body.type) {
            return NextResponse.json(
                { error: 'Missing required fields (amount, debitAccount, creditAccount, type)' },
                { status: 400 }
            );
        }

        const AccountingEntry = (await import('@/models/AccountingEntry')).default;

        const entry = await AccountingEntry.createEntry({
            ...body,
            refType: 'Manual',
            date: body.date || new Date()
        });

        return NextResponse.json({ success: true, entry });

    } catch (error) {
        console.error('Error creating accounting entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
