/**
 * Log Service (Client-Side)
 * Connects to Backend API
 */
export const LogService = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`/api/logs?${query}`);
        if (!res.ok) throw new Error('Failed to fetch logs');
        return res.json();
    },

    async getRecentActivity(limit = 10) {
        const res = await fetch(`/api/logs?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch recent activity');
        return res.json();
    }
};
