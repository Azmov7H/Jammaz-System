/**
 * Daily Sales Service (Client-Side)
 * Connects to Backend API
 */
export const DailySalesService = {
    async getDailySummary(date) {
        const query = new URLSearchParams({ date }).toString();
        const res = await fetch(`/api/daily-sales/summary?${query}`);
        if (!res.ok) throw new Error('Failed to fetch daily sales summary');
        return res.json();
    },

    async getSalesByPeriod(startDate, endDate) {
        const query = new URLSearchParams({ startDate, endDate }).toString();
        const res = await fetch(`/api/reports/sales?${query}`);
        if (!res.ok) throw new Error('Failed to fetch sales reports');
        return res.json();
    }
};
