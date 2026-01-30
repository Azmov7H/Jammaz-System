import { apiHandler } from '@/lib/api-handler';
import { DebtService } from '@/services/financial/debtService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const filter = {};

    const params = ['debtorId', 'debtorType', 'status', 'startDate', 'endDate'];
    params.forEach(p => {
        if (searchParams.has(p)) {
            const val = searchParams.get(p);
            if (val && val !== 'undefined' && val !== 'null') {
                filter[p] = val;
            }
        }
    });

    // Note: If status is not provided, debtService.getDebts() defaults to ['active', 'overdue']
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    return await DebtService.getDebts(filter, { page, limit });
}, { auth: true });

export const POST = apiHandler(async (req) => {
    const body = await req.json();
    body.createdBy = req.user.userId;
    return await DebtService.createDebt(body);
}, { auth: true });
