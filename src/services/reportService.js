import { api } from '@/lib/api-utils';

/**
 * Reports Service (Client-Side)
 * Connects to Backend Analytics Endpoints
 */
export const ReportService = {
    /**
     * Get financial income statement report
     */
    async getFinancialReport(startDate, endDate) {
        return await api.get(`/api/reports/financial?startDate=${startDate}&endDate=${endDate}`);
    },

    /**
     * Get profit by customer report
     */
    async getCustomerProfit(startDate, endDate) {
        return await api.get(`/api/reports/customer-profit?startDate=${startDate}&endDate=${endDate}`);
    },

    /**
     * Get shortage/surplus report
     */
    async getShortageReports(status = 'ALL') {
        return await api.get(`/api/reports/shortage?status=${status}`);
    },

    /**
     * Get inventory report
     */
    async getInventoryReport() {
        return await api.get('/api/reports/inventory');
    },

    /**
     * Get all price history (Global)
     */
    async getAllPriceHistory() {
        return await api.get('/api/reports/price-history');
    },

    /**
     * Get price history for a specific product
     */
    async getPriceHistory(productId) {
        return await api.get(`/api/reports/price-history/${productId}`);
    }
};
