import { apiHandler } from '@/lib/api-handler';
import { AuthService } from '@/services/authService';

export const POST = apiHandler(async () => {
    return await AuthService.logout();
});
