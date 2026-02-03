/**
 * User Service (Client-Side)
 * Connects to Backend API
 */
export const UserService = {
    async getAll() {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    },

    async getById(id) {
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
    },

    async create(data) {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to create user');
        }
        return res.json();
    },

    async update(id, data) {
        const res = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to update user');
        }
        return res.json();
    },

    async delete(id) {
        const res = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to delete user');
        }
        return res.json();
    }
};
