/**
 * Treasury Service (Client-Side)
 * Connects to Backend API
 */
export const TreasuryService = {
    /**
     * Get Treasury Summary (Balance, Income, Expense, Transactions)
     */
    async getSummary(startDate, endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const res = await fetch(`/api/treasury/summary?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch treasury summary');
        return res.json();
    },

    /**
     * Get Daily Cashbox
     */
    async getDailyCashbox(date) {
        const params = new URLSearchParams();
        if (date) params.append('date', date);

        const res = await fetch(`/api/treasury/daily?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch daily cashbox');
        return res.json();
    },

    /**
     * Get Transactions
     */
    async getTransactions(startDate, endDate, type = null) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (type) params.append('type', type);

        const res = await fetch(`/api/treasury/transactions?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
    }
};
