import { api } from '@/lib/api-utils';

/**
 * Auth Service (Client-Side)
 * Connects to Backend API
 */
export const AuthService = {
    async login({ email, password }) {
        return await api.post('/api/auth/login', { email, password });
    },

    async logout() {
        return await api.post('/api/auth/logout');
    },

    async getSession() {
        try {
            return await api.get('/api/auth/session');
        } catch (err) {
            return null;
        }
    },

    async handleGoogleCallback(code) {
        return await api.post('/api/auth/google/callback', { code });
    }
};
