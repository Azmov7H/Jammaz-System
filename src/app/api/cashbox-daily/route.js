import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { TreasuryService } from '@/lib/services/treasuryService';
import { getCurrentUser } from '@/lib/auth';

/**
 * Get cashbox data
 */
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const action = searchParams.get('action'); // 'balance', 'daily', 'history'

        // Get current balance
        if (action === 'balance') {
            const balance = await TreasuryService.getCurrentBalance();
            return NextResponse.json({ balance });
        }

        // Get single day
        if (dateStr) {
            const date = new Date(dateStr);
            const cashbox = await TreasuryService.getDailyCashbox(date);

            if (!cashbox) {
                return NextResponse.json({
                    message: 'لا توجد بيانات خزينة لهذا اليوم',
                    date: dateStr
                });
            }

            return NextResponse.json({ cashbox });
        }

        // Get history
        if (startDateStr && endDateStr) {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            const history = await TreasuryService.getCashboxHistory(startDate, endDate);
            return NextResponse.json({ history });
        }

        // Default: Get today
        const today = new Date();
        const cashbox = await TreasuryService.getDailyCashbox(today);
        return NextResponse.json({ cashbox });

    } catch (error) {
        console.error('Cashbox API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Add manual income/expense or reconcile
 */
export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { action, date, amount, reason, category, actualClosingBalance, notes } = body;

        const targetDate = date ? new Date(date) : new Date();

        if (action === 'addIncome') {
            const cashbox = await TreasuryService.addManualIncome(
                targetDate,
                amount,
                reason,
                user.userId
            );
            return NextResponse.json({ cashbox });
        }

        if (action === 'addExpense') {
            const cashbox = await TreasuryService.addManualExpense(
                targetDate,
                amount,
                reason,
                category || 'other',
                user.userId
            );
            return NextResponse.json({ cashbox });
        }

        if (action === 'reconcile') {
            const cashbox = await TreasuryService.reconcileCashbox(
                targetDate,
                actualClosingBalance,
                user.userId,
                notes
            );
            return NextResponse.json({ cashbox });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Cashbox POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
