import { apiHandler } from '@/lib/api-handler';
import { CustomerService } from '@/lib/services/customerService';
import { customerSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await CustomerService.getAll(query);
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = customerSchema.parse(body);
    return await CustomerService.create(validated);
});
