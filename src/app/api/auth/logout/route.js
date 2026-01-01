import { apiHandler } from '@/lib/api-handler';
import { AuthService } from '@/lib/services/authService';

export const POST = apiHandler(async () => {
    return await AuthService.logout();
});
