import { api } from '@/lib/api-utils';

/**
 * Daily Sales Service (Client-Side)
 * Connects to Backend API
 */
export const DailySalesService = {
    /**
     * Get daily sales for a specific date
     */
    async getDailySales(date) {
        return await api.get(`/api/daily-sales?date=${date}`);
    },

    /**
     * Get sales summary for a date range (Reporting)
     */
    async getSalesSummary(startDate, endDate) {
        const start = startDate instanceof Date ? startDate.toISOString() : startDate;
        const end = endDate instanceof Date ? endDate.toISOString() : endDate;
        return await api.get(`/api/reports/sales?startDate=${start}&endDate=${end}`);
    },

    /**
     * Get best sellers for a period
     */
    async getBestSellers(startDate, endDate, limit = 10) {
        const start = startDate instanceof Date ? startDate.toISOString() : startDate;
        const end = endDate instanceof Date ? endDate.toISOString() : endDate;
        return await api.get(`/api/daily-sales/best-sellers?startDate=${start}&endDate=${end}&limit=${limit}`);
    }
};
