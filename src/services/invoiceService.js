/**
 * Invoice Service (Client-Side)
 * Connects to Backend API
 */
export const InvoiceService = {
    async getAll(params = {}) {
        const query = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                query.append(key, params[key]);
            }
        });

        const res = await fetch(`/api/invoices?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch invoices');
        return res.json();
    },

    async getById(id) {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error('Failed to fetch invoice');
        return res.json();
    },

    async create(data) {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || 'Failed to create invoice');
        }
        return result;
    },

    async deleteInvoice(id) {
        const res = await fetch(`/api/invoices/${id}`, {
            method: 'DELETE'
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || 'Failed to delete invoice');
        }
        return result;
    }
};
