import { apiHandler } from '@/lib/api-handler';
import { FinanceService } from '@/services/financeService';
import { DebtService } from '@/services/financial/debtService';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const debtId = searchParams.get('debtId');

    if (!debtId) {
        throw 'debtId is required';
    }

    const payments = await DebtService.getDebtPayments(debtId);
    return payments;
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const body = await req.json();

    // Adapt body for settleDebt if coming from old payment form
    let id = body.debtId || body.id;
    let type = body.type;

    // If we have a debtId, we must resolve it to the underlying reference (Invoice or PO)
    if (body.debtId || (body.id && !body.type)) {
        const { default: Debt } = await import('@/models/Debt');
        const debt = await Debt.findById(id);
        if (debt) {
            id = debt.referenceId; // Use the Invoice/PO ID
            type = debt.debtorType === 'Customer' ? 'receivable' : 'payable';
        }
    }

    const data = {
        id: id,
        amount: body.amount,
        method: body.method || 'cash',
        note: body.notes || body.note || '',
        type: type || 'receivable'
    };

    const result = await FinanceService.settleDebt(data, user.userId);
    return result;
});
