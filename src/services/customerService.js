/**
 * Customer Service (Client-Side)
 * Connects to Backend API
 */
export const CustomerService = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`/api/customers?${query}`);
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
    },

    async getById(id) {
        const res = await fetch(`/api/customers/${id}`);
        if (!res.ok) throw new Error('Failed to fetch customer');
        return res.json();
    },

    async create(data) {
        const res = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to create customer');
        }
        return res.json();
    },

    async update(id, data) {
        const res = await fetch(`/api/customers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to update customer');
        }
        return res.json();
    },

    async delete(id) {
        const res = await fetch(`/api/customers/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to delete customer');
        }
        return res.json();
    },

    async getFinancials(id) {
        const res = await fetch(`/api/customers/${id}/financials`);
        if (!res.ok) throw new Error('Failed to fetch customer financials');
        return res.json();
    }
};
