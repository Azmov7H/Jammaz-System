import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { PaymentService } from '@/lib/services/financial/paymentService';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const debtId = searchParams.get('debtId');

    if (!debtId) {
        throw new Error('debtId is required');
    }

    const payments = await PaymentService.getDebtPayments(debtId);
    return NextResponse.json({ success: true, data: payments });
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    const body = await req.json();

    // Force recorder
    body.recordedBy = user._id;

    const payment = await PaymentService.recordPayment(body);
    return NextResponse.json({ success: true, data: payment });
});
