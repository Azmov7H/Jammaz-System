import { apiHandler } from '@/lib/core/api-handler';
import { CustomerService } from '@/lib/services/customerService';
import { customerSchema } from '@/lib/core/validators';
import { getCurrentUser } from '@/lib/core/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    return await CustomerService.getById(id);
});

export const PUT = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = customerSchema.partial().parse(body);
    return await CustomerService.update(id, validated);
});

export const DELETE = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return await CustomerService.delete(id);
});
