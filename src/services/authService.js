/**
 * Auth Service (Client-Side)
 * Connects to Backend API
 */
export const AuthService = {
    async login({ email, password }) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Login failed');
        }

        return res.json();
    },

    async logout() {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (!res.ok) throw new Error('Logout failed');
        return res.json();
    },

    async getSession() {
        const res = await fetch('/api/auth/session');
        if (!res.ok) return null;
        return res.json();
    },

    async handleGoogleCallback(code) {
        const res = await fetch('/api/auth/google/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        if (!res.ok) {
            throw new Error('Google authentication failed');
        }
        return res.json();
    }
};
