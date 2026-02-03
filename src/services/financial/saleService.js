/**
 * Sale Service (Client-Side)
 * Connects to Backend API
 * NOTE: Most Sale logic is handled by InvoiceService. 
 * This service is kept for compatibility if specific sale-only endpoints are needed.
 */
import { InvoiceService } from '../invoiceService';

export const SaleService = {
    // Delegate to InvoiceService
    async recordSale(invoiceData) {
        return InvoiceService.create(invoiceData);
    },

    async reverseSale(invoiceId) {
        return InvoiceService.deleteInvoice(invoiceId);
    }
};
