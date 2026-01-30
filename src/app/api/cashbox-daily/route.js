import { apiHandler } from '@/lib/api-handler';
import { TreasuryService } from '@/services/treasuryService';

/**
 * Get cashbox data
 */
export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const action = searchParams.get('action'); // 'balance', 'daily', 'history'

    // Get current balance
    if (action === 'balance') {
        const balance = await TreasuryService.getCurrentBalance();
        return { balance };
    }

    // Get single day
    if (dateStr) {
        const date = new Date(dateStr);
        const cashbox = await TreasuryService.getDailyCashbox(date);

        if (!cashbox) {
            return {
                message: 'لا توجد بيانات خزينة لهذا اليوم',
                date: dateStr
            };
        }

        return { cashbox };
    }

    // Get history
    if (startDateStr && endDateStr) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const history = await TreasuryService.getCashboxHistory(startDate, endDate);
        return { history };
    }

    // Default: Get today
    const today = new Date();
    const cashbox = await TreasuryService.getDailyCashbox(today);
    return { cashbox };
}, { auth: true });

/**
 * Add manual income/expense or reconcile
 */
export const POST = apiHandler(async (req) => {
    const body = await req.json();
    const { action, date, amount, reason, category, actualClosingBalance, notes } = body;

    const targetDate = date ? new Date(date) : new Date();

    if (action === 'addIncome') {
        const cashbox = await TreasuryService.addManualIncome(
            targetDate,
            amount,
            reason,
            req.user.userId
        );
        return { cashbox };
    }

    if (action === 'addExpense') {
        const cashbox = await TreasuryService.addManualExpense(
            targetDate,
            amount,
            reason,
            category || 'other',
            req.user.userId
        );
        return { cashbox };
    }

    if (action === 'reconcile') {
        const cashbox = await TreasuryService.reconcileCashbox(
            targetDate,
            actualClosingBalance,
            req.user.userId,
            notes
        );
        return { cashbox };
    }

    throw 'Invalid action';
}, { auth: true });
