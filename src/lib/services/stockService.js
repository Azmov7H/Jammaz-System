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

        // Determine sign based on type
        if (type === 'OUT') {
            delta = -delta;
        }
        // For ADJUST, we assume the qty passed IS the delta (can be negative) 
        // OR we follow strict convention. Let's assume manual adjust passes signed delta if needed, 
        // BUT the prompt implies 'qty' is magnitude.
        // Let's stick to: IN = +, OUT = -. ADJUST/TRANSFER = Let caller decide sign? 
        // Or simpler: ADJUST adds the qty. Use negative qty to reduce.

        // However, validation in `validateStock` is for OUT operations usually.

        await Product.findByIdAndUpdate(productId, {
            $inc: { stockQty: delta }
        });

        const movement = await StockMovement.create({
            productId,
            type,
            qty: Math.abs(delta), // Store magnitude often, or signed? Schema didn't specify. Let's store magnitude and rely on Type.
            note,
            refId,
            createdBy: userId,
            date: new Date()
        });

        return movement;
    }
};
