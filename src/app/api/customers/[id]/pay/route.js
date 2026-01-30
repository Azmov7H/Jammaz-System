import { apiHandler } from '@/lib/api-handler';
import { FinanceService } from '@/services/financeService';
export const POST = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const { amount, method, note } = body;

    if (!amount || amount <= 0) {
        throw new Error('قيمة الدفعة يجب أن تكون أكبر من صفر');
    }

    const result = await FinanceService.recordTotalCustomerPayment(
        id,
        parseFloat(amount),
        method || 'cash',
        note,
        req.user.userId
    );

    return result;
}, { auth: true });
