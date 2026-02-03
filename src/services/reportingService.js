/**
 * Reporting Service (Client-Side)
 * Connects to Backend API
 */
export const ReportingService = {
    async getShortageReports(status = 'ALL') {
        const query = new URLSearchParams({ status }).toString();
        const res = await fetch(`/api/reports/shortage?${query}`);
        if (!res.ok) throw new Error('Failed to fetch shortage reports');
        return res.json();
    },

    async getInventoryReport() {
        const res = await fetch('/api/reports/inventory');
        if (!res.ok) throw new Error('Failed to fetch inventory report');
        return res.json();
    },

    async getFinancialReport(startDate, endDate) {
        const query = new URLSearchParams({ startDate, endDate }).toString();
        const res = await fetch(`/api/reports/financial?${query}`);
        if (!res.ok) throw new Error('Failed to fetch financial report');
        return res.json();
    }
};
