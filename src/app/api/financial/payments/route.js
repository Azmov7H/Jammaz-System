import { apiHandler } from '@/lib/core/api-handler';
import { PaymentService } from '@/lib/services/financial/paymentService';
import { getCurrentUser } from '@/lib/core/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const debtId = searchParams.get('debtId');

    if (!debtId) {
        throw 'debtId is required';
    }

    const payments = await PaymentService.getDebtPayments(debtId);
    return payments;
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const body = await req.json();

    // Force recorder
    body.recordedBy = user.userId;

    const payment = await PaymentService.recordPayment(body);
    return payment;
});
