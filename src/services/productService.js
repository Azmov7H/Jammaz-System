/**
 * Product Service (Client-Side)
 * Connects to Backend API
 */
export const ProductService = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`/api/products?${query}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    async getMetadata() {
        const res = await fetch('/api/products/metadata');
        if (!res.ok) throw new Error('Failed to fetch product metadata');
        return res.json();
    },

    async getById(id) {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
    },

    async create(data) {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to create product');
        }
        return res.json();
    },

    async update(id, data) {
        const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to update product');
        }
        return res.json();
    },

    async delete(id) {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to delete product');
        }
        return res.json();
    }
};
