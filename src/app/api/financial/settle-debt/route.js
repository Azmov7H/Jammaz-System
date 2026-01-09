import { apiHandler } from '@/lib/api-handler';
import { FinanceService } from '@/lib/services/financeService';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const settleDebtSchema = z.object({
    type: z.enum(['receivable', 'payable']),
    id: z.string().min(1),
    amount: z.number().positive(),
    method: z.enum(['cash', 'bank']).optional().default('cash'),
    note: z.string().optional().default('')
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = settleDebtSchema.parse(body);

    try {
        const result = await FinanceService.settleDebt(validated, user.userId);
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: typeof error === 'string' ? error : 'خطأ أثناء سداد الدين'
        }, { status: 400 });
    }
});
