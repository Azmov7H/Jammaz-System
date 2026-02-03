import { TreasuryService } from './treasuryService';

/**
 * Finance Service (Client-Side)
 * orchestrates financial operations via Backend API
 */
export const FinanceService = {
    /**
     * Record User Payment (Unified or Specific)
     */
    async recordPayment(data) {
        // Delegate to specific API endpoints or TreasuryService
        // Assuming we have an endpoint for payments: POST /api/payments
        // OR we use TreasuryService manual income/expense logic if it fits
        // But usually payments are specific entities.

        // Check if backend has a dedicated payment route. 
        // Based on backend routes, we have 'financial/payments' or similar?
        // Let's assume we use /api/payments or similar.

        const res = await fetch('/api/financial/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const result = await res.json();
            throw new Error(result.message || 'Payment recording failed');
        }
        return res.json();
    },

    /**
     * Record a Collection (Customer Payment)
     */
    async recordCustomerPayment(invoice, amount, method, note, userId) {
        // Logic should be in backend. We just send a request.
        // POST /api/invoices/:id/payment ?? 
        // or POST /api/financial/payments/collect

        return this.recordPayment({
            type: 'COLLECTION',
            invoiceId: invoice._id,
            amount,
            method,
            note,
            customerId: invoice.customer?._id || invoice.customer
        });
    },

    /**
     * Record Total Customer Payment (Unified)
     */
    async recordTotalCustomerPayment(customerId, amount, method, note, userId) {
        return this.recordPayment({
            type: 'UNIFIED_COLLECTION',
            customerId,
            amount,
            method,
            note
        });
    },

    // Delegate other methods to TreasuryService if they are pure treasury ops
    async getTreasurySummary(startDate, endDate) {
        return TreasuryService.getSummary(startDate, endDate);
    }
};
