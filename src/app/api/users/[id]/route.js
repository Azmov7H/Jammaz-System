import { apiHandler } from '@/lib/core/api-handler';
import { UserService } from '@/lib/services/userService';
import { getCurrentUser } from '@/lib/core/auth';
import { updateUserSchema } from '@/lib/core/validators';
import { NextResponse } from 'next/server';

export const PUT = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateUserSchema.parse(body);
    return await UserService.update(id, validated);
});

export const DELETE = apiHandler(async (req, { params }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    return await UserService.delete(id);
});
