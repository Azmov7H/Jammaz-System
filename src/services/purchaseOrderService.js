/**
 * Purchase Order Service (Client-Side)
 * Connects to Backend API
 */
export const PurchaseOrderService = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`/api/purchases?${query}`);
        if (!res.ok) throw new Error('Failed to fetch purchase orders');
        return res.json();
    },

    async getById(id) {
        const res = await fetch(`/api/purchases/${id}`);
        if (!res.ok) throw new Error('Failed to fetch purchase order');
        return res.json();
    },

    async create(data) {
        const res = await fetch('/api/purchases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to create purchase order');
        }
        return res.json();
    },

    async updateStatus(id, status, notes) {
        const res = await fetch(`/api/purchases/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes })
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to update status');
        }
        return res.json();
    },

    async receive(id, receivedData) {
        const res = await fetch(`/api/purchases/${id}/receive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receivedData)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to receive purchase order');
        }
        return res.json();
    }
};
