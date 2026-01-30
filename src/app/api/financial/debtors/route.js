import { apiHandler } from '@/lib/api-handler';
import { DebtService } from '@/services/financial/debtService';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'Customer';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await DebtService.getDebtorsWithBalance(type, { search }, { page, limit });
    return result;
}, { auth: true });
