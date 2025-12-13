import Product from '@/models/Product';
import StockMovement from '@/models/StockMovement';

export const StockService = {
    /**
     * Validate if enough stock exists for a given product
     */
    async validateStock(productId, qty) {
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');
        if (product.stockQty < qty) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQty}`);
        }
        return product;
    },

    /**
     * Update stock quantity and record movement
     * @param {string} productId 
     * @param {number} qty - Positive amount to change. Direction determined by type.
     * @param {string} type - 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'
     * @param {string} note 
     * @param {string} refId - Optional reference ID (Invoice ID)
     * @param {string} userId - User performing action
     */
    async updateStock(productId, qty, type, note, refId, userId) {
        let delta = Number(qty);
        let updateQuery = {};

        // Validation first
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');

        if (type === 'IN') {
            // General purchase/add -> goes to Warehouse by default? Or Global Stock?
            // Let's assume IN increases WarehouseQty + StockQty
            updateQuery = { $inc: { stockQty: delta, warehouseQty: delta } };
        } else if (type === 'OUT') {
            // General damage/loss -> remove from ... where?
            // Default OUT from Warehouse? 
            // Let's assume OUT removes from Warehouse unless specified otherwise (simplification)
            if (product.warehouseQty < delta) throw new Error(`Insufficient Warehouse Stock: ${product.warehouseQty}`);
            updateQuery = { $inc: { stockQty: -delta, warehouseQty: -delta } };
        } else if (type === 'OUT_SALE') {
            // Sale -> remove from Shop
            if (product.shopQty < delta) throw new Error(`الكمية غير متوفرة في المحل: ${product.shopQty}`);
            updateQuery = { $inc: { stockQty: -delta, shopQty: -delta } };
        } else if (type === 'TRANSFER_TO_SHOP') {
            if (product.warehouseQty < delta) throw new Error(`R: ${product.warehouseQty} (مخزن) غير كافي للتحويل. المطلوب: ${delta}`);
            // Move: Warehouse -> Shop. Total Stock stays same involved? No, Total stock is same.
            updateQuery = { $inc: { warehouseQty: -delta, shopQty: delta } };
        } else if (type === 'TRANSFER_TO_WAREHOUSE') {
            if (product.shopQty < delta) throw new Error(`R: ${product.shopQty} (محل) غير كافي للإرجاع. المطلوب: ${delta}`);
            // Move: Shop -> Warehouse
            updateQuery = { $inc: { shopQty: -delta, warehouseQty: delta } };
        } else if (type === 'ADJUST') {
            // Adjust usually comes from "Audit" or "Manual Correction".
            // We need to know WHICH quantity to adjust: Warehouse or Shop.
            // Implicitly, we can infer from the note or require it in metadata?
            // For now, let's assume if it comes from the product page edit, we handled it as separate calls.
            // If it's generic, we default to Warehouse for safety.

            // Better logic: The caller should pass specific type 'ADJUST_SHOP' or 'ADJUST_WAREHOUSE', or we misuse 'ADJUST' for global?
            // Let's stick to the current "Stock" page which just calls "IN/OUT".
            // If the user uses "Hand Movement" dialog, they pick IN/OUT/TRANSFER.
            // "ADJUST" is internal from Product Edit.
            // Let's check the Product Edit Route again... it sends 'ADJUST' with note "Manual from Product Page (Shop)".

            if (note && note.includes('محل')) {
                updateQuery = { $inc: { shopQty: delta, stockQty: delta } };
            } else {
                updateQuery = { $inc: { warehouseQty: delta, stockQty: delta } };
            }
        }

        await Product.findByIdAndUpdate(productId, updateQuery);

        const movement = await StockMovement.create({
            productId,
            type,
            qty: Math.abs(delta),
            note,
            refId,
            createdBy: userId,
            date: new Date()
        });

        return movement;
    }
};
