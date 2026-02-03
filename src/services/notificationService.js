/**
 * Notification Service (Client-Side)
 * Connects to Backend API
 */
export const NotificationService = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`/api/notifications?${query}`);
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
    },

    async markAsRead(id) {
        const res = await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT'
        });
        if (!res.ok) throw new Error('Failed to mark notification as read');
        return res.json();
    },

    async markAllAsRead() {
        const res = await fetch('/api/notifications/read-all', {
            method: 'PUT'
        });
        if (!res.ok) throw new Error('Failed to mark all as read');
        return res.json();
    },

    async getUnreadCount() {
        // Backend logic suggests using getAll with unread=true filter effectively or a specific count endpoint if exists.
        // Assuming getAll({ unread: true }) returns a list, and we count length, or backend metadata.
        // Or if backend has /count endpoint. Let's assume params for now.
        const res = await fetch('/api/notifications?unread=true');
        if (!res.ok) return 0;
        const data = await res.json();
        return data.length || data.count || 0;
    }
};
