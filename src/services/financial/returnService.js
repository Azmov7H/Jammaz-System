/**
 * Return Service (Client-Side)
 * Connects to Backend API
 */
export const ReturnService = {
    async processSaleReturn(invoiceId, returnData, refundMethod) {
        // Assuming backend endpoint exists at /api/financial/returns
        // The backend's financeRoutes.js has: POST /returns
        const res = await fetch('/api/financial/returns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoice: { _id: invoiceId }, returnData, refundMethod })
        });

        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Failed to process return');
        }
        return res.json();
    }
};
