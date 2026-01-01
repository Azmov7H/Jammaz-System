import { apiHandler } from '@/lib/api-handler';
import { ProductService } from '@/lib/services/productService';
import { productSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req, { params }) => {
    return await ProductService.getById(params.id);
});

export const PUT = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // Use partial schema for updates or full schema depending on requirements.
    // Ideally we should have updateProductSchema. For now using recursive partial manually or just parsing valid fields.
    const validated = productSchema.partial().parse(body);

    return await ProductService.update(params.id, validated, user.userId);
});

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return await ProductService.delete(params.id);
});
