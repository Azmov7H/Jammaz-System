import { apiHandler } from '@/lib/api-handler';
import { AuthService } from '@/services/authService';
import { NextResponse } from 'next/server';

export const GET = apiHandler(async () => {
    const user = await AuthService.getSession();
    // Return direct NextResponse to match existing frontend expectations if needed, 
    // BUT since we are standardizing, let's keep consistent format.
    // However, the frontend likely checks `if (!data.user)` or similar. 
    // The apiHandler wraps this in { success: true, data: { user: ... } }

    return { user };
});
