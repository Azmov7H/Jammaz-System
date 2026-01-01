import { apiHandler } from '@/lib/api-handler';
import { CustomerService } from '@/lib/services/customerService';
import { customerSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req, { params }) => {
    return await CustomerService.getById(params.id);
});

export const PUT = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = customerSchema.partial().parse(body);
    return await CustomerService.update(params.id, validated);
});

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return await CustomerService.delete(params.id);
});
