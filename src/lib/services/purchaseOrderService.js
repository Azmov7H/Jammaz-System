import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import InvoiceSettings from '@/models/InvoiceSettings';
import { FinanceService } from '@/lib/services/financeService';
import dbConnect from '@/lib/db';

export const PurchaseOrderService = {
    async create(data, userId) {
        await dbConnect();

        const { supplierId, items, notes } = data;
        let { expectedDate } = data;

        if (!expectedDate) {
            let terms = 15; // default
            if (supplierId) {
                const sup = await Supplier.findById(supplierId);
                if (sup && sup.supplyTerms > 0) terms = sup.supplyTerms;
            }
            // Could fetch settings fallback too
            const date = new Date();
            date.setDate(date.getDate() + terms);
            expectedDate = date;
        }

        let totalCost = 0;
        items.forEach(item => {
            totalCost += item.quantity * item.costPrice;
        });

        const po = await PurchaseOrder.create({
            poNumber: `PO-${Date.now()}`,
            supplier: supplierId,
            items,
            totalCost,
            expectedDate,
            notes,
            createdBy: userId
        });

        return po;
    },

    async receive(id, paymentType, userId) {
        await dbConnect();
        const po = await PurchaseOrder.findById(id).populate('items.productId');
        if (!po) throw 'PO not found';
        if (po.status === 'RECEIVED') throw 'Already received';

        // Finance & Stock Update (handled deep inside FinanceService based on previous route logic?)
        // The previous route called `FinanceService.recordPurchaseReceive(po, userId, paymentType)`.
        // This likely updates stock inside FinanceService OR StockService call. 
        // Based on `StockService.increaseStockForPurchase` seen earlier, FinanceService probably calls that.

        await FinanceService.recordPurchaseReceive(po, userId, paymentType);

        return await PurchaseOrder.findById(id); // Return updated PO
    },

    async getAll({ limit = 20 }) {
        await dbConnect();
        return await PurchaseOrder.find({})
            .populate('supplier', 'name')
            .populate('items.productId', 'name code')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
};
