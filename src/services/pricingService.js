/**
 * Pricing Service (Client-Side)
 * Connects to Backend API
 */
export const PricingService = {
    async getPriceHistory(productId, startDate, endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const res = await fetch(`/api/pricing/history/${productId}?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch price history');
        return res.json();
    },

    async setCustomPrice(customerId, productId, price) {
        const res = await fetch('/api/pricing/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId, productId, price })
        });
        if (!res.ok) throw new Error('Failed to set custom price');
        return res.json();
    },

    async removeCustomPrice(customerId, productId) {
        const res = await fetch('/api/pricing/custom', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId, productId })
        });
        if (!res.ok) throw new Error('Failed to remove custom price');
        return res.json();
    },

    async getCustomerPricing(customerId) {
        const res = await fetch(`/api/pricing/customer/${customerId}`);
        if (!res.ok) throw new Error('Failed to fetch customer pricing');
        return res.json();
    }
};
