import { apiHandler } from '@/lib/core/api-handler';
import { UserService } from '@/lib/services/userService';
import { userSchema } from '@/lib/core/validators';
import { getCurrentUser } from '@/lib/core/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (!hasPermission(user.role, 'users:view') && user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const users = await UserService.getAll(query);

    return { users };
});

export const POST = apiHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (!hasPermission(user.role, 'users:create') && user.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = userSchema.parse(body);
    const newUser = await UserService.create(validated);

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
});
    }

const body = await req.json();
const validated = userSchema.parse(body);
const newUser = await UserService.create(validated);

return NextResponse.json({ success: true, user: newUser }, { status: 201 });
});
