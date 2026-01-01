import { apiHandler } from '@/lib/api-handler';
import { UserService } from '@/lib/services/userService';
import { getCurrentUser } from '@/lib/auth';
import { userSchema } from '@/lib/validators';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async () => {
    // Permission Check
    const user = await getCurrentUser();
    if (!user || !['owner', 'manager', 'admin'].includes(user.role)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return await UserService.getAll();
});

export const POST = apiHandler(async (req) => {
    // Permission Check
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') { // Only owner can add users
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = userSchema.parse(body);
    return await UserService.create(validated);
});
