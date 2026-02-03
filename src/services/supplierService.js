/**
 * Supplier Service (Client-Side)
 * Connects to Backend API
 */
export const SupplierService = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`/api/suppliers?${query}`);
        if (!res.ok) throw new Error('Failed to fetch suppliers');
        return res.json();
    },

    async getById(id) {
        const res = await fetch(`/api/suppliers/${id}`);
        if (!res.ok) throw new Error('Failed to fetch supplier');
        return res.json();
    },

    async create(data) {
        const res = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to create supplier');
        }
        return res.json();
    },

    async update(id, data) {
        const res = await fetch(`/api/suppliers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to update supplier');
        }
        return res.json();
    },

    async delete(id) {
        const res = await fetch(`/api/suppliers/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to delete supplier');
        }
        return res.json();
    }
};
