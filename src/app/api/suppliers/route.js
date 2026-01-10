import { apiHandler } from '@/lib/core/api-handler';
import { SupplierService } from '@/lib/services/supplierService';
import { supplierSchema } from '@/lib/core/validators';
import { getCurrentUser } from '@/lib/core/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    return await SupplierService.getAll(query);
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const body = await req.json();
    const validated = supplierSchema.parse(body);
    return await SupplierService.create(validated);
});
