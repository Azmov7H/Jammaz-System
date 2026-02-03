/**
 * Stock Management Service (Client-Side)
 * Connects to Backend API
 */
export const StockService = {
    /**
     * Get all stock movements (with optional filters)
     */
    async getMovements(startDate, endDate, type = null) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (type) params.append('type', type);

        const res = await fetch(`/api/stock/movements?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch movements');
        return res.json();
    },

    /**
     * Get stock status (products with quantities)
     */
    async getStockStatus(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`/api/stock/status?${query}`);
        if (!res.ok) throw new Error('Failed to fetch stock status');
        return res.json();
    },

    /**
     * Move Stock (Single or Bulk)
     * Handles: 'IN', 'OUT', 'SALE', 'TRANSFER_TO_SHOP', 'TRANSFER_TO_WAREHOUSE'
     */
    async moveStock(data) {
        // data can be { productId, qty, type, ... } OR { items: [...] }
        const res = await fetch('/api/stock/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || 'Stock movement failed');
        }
        return result;
    },

    /**
     * Validation helper (Client-side pre-check or API call)
     */
    async validateStockAvailability(items) {
        // Option 1: Client side check if we have the data
        // Option 2: New API endpoint. 
        // For now, let's skip strict pre-validation or implement a check endpoint if needed.
        // We will return true to allow the UI to proceed to the backend check.
        return items.map(item => ({ ...item, available: true }));
    }
};
