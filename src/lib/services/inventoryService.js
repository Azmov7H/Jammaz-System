import { StockService } from './stockService';

/**
 * Inventory Service
 * Wrapper around StockService for inventory operations
 * This provides backward compatibility for inventory/transfer routes
 */
export const InventoryService = {
    /**
     * Move stock between locations or adjust inventory
     * @param {Object} params - Movement parameters
     * @param {string} params.productId - Product ID
     * @param {number} params.qty - Quantity to move
     * @param {string} params.type - Movement type (TRANSFER_TO_SHOP, TRANSFER_TO_WAREHOUSE, etc.)
     * @param {string} params.userId - User performing the action
     * @param {string} params.note - Optional note
     * @param {string} params.refId - Optional reference ID
     * @returns {Promise<Product>} Updated product
     */
    async moveStock(params) {
        return await StockService.moveStock(params);
    },

    /**
     * Transfer stock from warehouse to shop
     */
    async transferToShop(productId, quantity, userId, note) {
        return await StockService.transferToShop(productId, quantity, userId, note);
    },

    /**
     * Transfer stock from shop to warehouse
     */
    async transferToWarehouse(productId, quantity, userId, note) {
        return await StockService.transferToWarehouse(productId, quantity, userId, note);
    },

    /**
     * Adjust stock quantities
     */
    async adjustStock(productId, newWarehouseQty, newShopQty, reason, userId) {
        return await StockService.adjustStock(productId, newWarehouseQty, newShopQty, reason, userId);
    },

    /**
     * Validate stock availability
     */
    async validateStockAvailability(items) {
        return await StockService.validateStockAvailability(items);
    },

    /**
     * Get product movement history
     */
    async getProductHistory(productId, limit) {
        return await StockService.getProductHistory(productId, limit);
    },

    /**
     * Bulk move stock
     */
    async bulkMoveStock({ items, type, userId }) {
        return await StockService.bulkMoveStock({ items, type, userId });
    }
};
