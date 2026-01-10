import { apiHandler } from '@/lib/core/api-handler';
import { DebtService } from '@/lib/services/financial/debtService';
import { getCurrentUser } from '@/lib/core/auth';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await DebtService.getInstallments(id);
});

export const POST = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const body = await req.json();
    const { installmentsCount, interval, startDate } = body;

    return await DebtService.createInstallmentPlan({
        debtId: id,
        installmentsCount,
        interval,
        startDate,
        userId: user.userId
    });
});
