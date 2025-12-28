import Link from 'next/link'; // Not needed in service but standard imports cleanup
import Product from '@/models/Product';
import StockMovement from '@/models/StockMovement';
import dbConnect from '@/lib/db';

/**
 * Service to handle ALL stock related operations safely.
 */
export const InventoryService = {

    /**
     * Move stock between locations or add/remove stock
     * @param {object} params
     * @param {string} params.productId
     * @param {number} params.qty - Always positive
     * @param {string} params.type - 'IN' | 'OUT' | 'TRANSFER_TO_SHOP' | 'TRANSFER_TO_WAREHOUSE' | 'ADJUST' | 'SALE'
     * @param {string} params.userId
     * @param {string} params.note
     * @param {string} params.refId
     * @param {boolean} params.isSystem - internal system override
     */
    async moveStock({ productId, qty, type, userId, note, refId, isSystem = false }) {
        await dbConnect();

        const quantity = Math.abs(Number(qty));
        if (quantity === 0) throw new Error('Quantity must be greater than 0');

        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');

        let updateQuery = {};

        switch (type) {
            case 'IN': // Purchase (Add to Warehouse default)
                updateQuery = { $inc: { warehouseQty: quantity, stockQty: quantity } };
                break;

            case 'OUT': // Loss/Damage (Remove from Warehouse default)
                if (product.warehouseQty < quantity && !isSystem) {
                    throw new Error(`Insufficient warehouse stock. Available: ${product.warehouseQty}`);
                }
                updateQuery = { $inc: { warehouseQty: -quantity, stockQty: -quantity } };
                break;

            case 'SALE': // Sale (Remove from SHOP)
                if (product.shopQty < quantity && !isSystem) {
                    // Check if we can auto-drain warehouse? No, strict separation.
                    throw new Error(`Insufficient shop stock for sale. Available: ${product.shopQty}`);
                }
                updateQuery = { $inc: { shopQty: -quantity, stockQty: -quantity } };
                break;

            case 'TRANSFER_TO_SHOP': // Warehouse -> Shop
                if (product.warehouseQty < quantity && !isSystem) {
                    throw new Error(`Insufficient warehouse stock for transfer. Available: ${product.warehouseQty}`);
                }
                updateQuery = { $inc: { warehouseQty: -quantity, shopQty: quantity } };
                break;

            case 'TRANSFER_TO_WAREHOUSE': // Shop -> Warehouse
                if (product.shopQty < quantity && !isSystem) {
                    throw new Error(`Insufficient shop stock for transfer. Available: ${product.shopQty}`);
                }
                updateQuery = { $inc: { shopQty: -quantity, warehouseQty: quantity } };
                break;

            case 'ADJUST': // Unknown manual adjustment
                // If note contains specific hints, use them, otherwise default to Warehouse
                if (note && note.toLowerCase().includes('shop')) {
                    updateQuery = { $inc: { shopQty: quantity, stockQty: quantity } };
                } else {
                    updateQuery = { $inc: { warehouseQty: quantity, stockQty: quantity } };
                }
                // NOTE: ADJUST is ambiguous. Ideally we split ADJUST_SHOP_IN, ADJUST_SHOP_OUT.
                // For now, assuming positive adjustment to Warehouse unless specified.
                // Actually, let's trust the Caller to use 'IN'/'OUT' for generic adds/removes.
                // 'ADJUST' is legacy.
                break;

            default:
                throw new Error('Invalid movement type');
        }

        // Execute Update
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateQuery, { new: true });

        // Record Movement
        await StockMovement.create({
            productId,
            type,
            qty: quantity,
            note,
            refId,
            createdBy: userId,
            date: new Date(),
            snapshot: {
                warehouseQty: updatedProduct.warehouseQty,
                shopQty: updatedProduct.shopQty
            }
        });

        return updatedProduct;
    },
    async bulkMoveStock({ items, type, userId }) {
        await dbConnect();
        const results = [];

        for (const item of items) {
            const result = await this.moveStock({
                productId: item.productId,
                qty: item.qty,
                type,
                userId,
                note: item.note || `Bulk ${type}`
            });
            results.push(result);
        }

        return results;
    },

    /**
     * Direct Adjustment (Admin force override)
     */
    async forceAdjust(productId, newWarehouseQty, newShopQty, userId, reason) {
        await dbConnect();
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');

        const oldW = product.warehouseQty;
        const oldS = product.shopQty;

        product.warehouseQty = newWarehouseQty;
        product.shopQty = newShopQty;
        product.stockQty = newWarehouseQty + newShopQty;
        await product.save();

        await StockMovement.create({
            productId,
            type: 'ADJUST',
            qty: 0, // Symbolic
            note: `Force Audit: W(${oldW}->${newWarehouseQty}), S(${oldS}->${newShopQty}). ${reason}`,
            createdBy: userId,
            date: new Date(),
            snapshot: { warehouseQty: newWarehouseQty, shopQty: newShopQty }
        });

        return product;
    }
};
