/**
 * Dashboard Service (Client-Side)
 * Connects to Backend API
 */
export const DashboardService = {
    async getUnifiedData() {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
    },

    async getStats() {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        return res.json();
    },

    async getKPIs() {
        const res = await fetch('/api/dashboard/kpis');
        if (!res.ok) throw new Error('Failed to fetch KPIs');
        return res.json();
    },

    async getStrategy() {
        const res = await fetch('/api/dashboard/strategy');
        if (!res.ok) throw new Error('Failed to fetch dashboard strategy');
        return res.json();
    }
};
