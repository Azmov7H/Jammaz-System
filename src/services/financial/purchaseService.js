import { PurchaseOrderService } from '../purchaseOrderService';

/**
 * Purchase Service (Financial)
 * Client-Side Wrapper
 */
export const PurchaseService = {
    async recordPurchaseReceive(po, userId, paymentType = 'cash') {
        const receivedData = {
            // Mapping formatted data if necessary, 
            // but the backend receive endpoint likely expects items/paymentType details.
            // If `po` is the full object, we might just need the ID and payment info.
            items: po.items,
            paymentType,
            receivedDate: new Date()
        };

        return PurchaseOrderService.receive(po._id, receivedData);
    }
};
