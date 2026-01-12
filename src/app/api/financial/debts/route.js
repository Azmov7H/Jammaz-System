import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { DebtService } from '@/services/financial/debtService';
import { getCurrentUser } from '@/lib/auth';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const filter = {};

    const params = ['debtorId', 'debtorType', 'status', 'startDate', 'endDate'];
    params.forEach(p => {
        if (searchParams.has(p)) filter[p] = searchParams.get(p);
    });

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await DebtService.getDebts(filter, { page, limit });
    return result; // apiHandler handles NextResponse.json({success, data})
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const body = await req.json();

    // Force creator
    body.createdBy = user.userId;

    const debt = await DebtService.createDebt(body);
    return debt;
});
