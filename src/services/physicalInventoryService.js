/**
 * Physical Inventory Service (Client-Side)
 * Connects to Backend API
 */
export const PhysicalInventoryService = {
    async getInventorySession() {
        const res = await fetch('/api/physical-inventory/current');
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to check inventory session');
        return res.json();
    },

    async startSession(name, notes) {
        const res = await fetch('/api/physical-inventory/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, notes })
        });
        if (!res.ok) throw new Error('Failed to start inventory session');
        return res.json();
    },

    async submitCount(barcode, quantity) {
        const res = await fetch('/api/physical-inventory/count', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barcode, quantity })
        });
        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to submit count');
        }
        return res.json();
    },

    async finalizeSession(sessionId) {
        const res = await fetch(`/api/physical-inventory/${sessionId}/finalize`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error('Failed to finalize inventory session');
        return res.json();
    }
};
