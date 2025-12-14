import Product from '@/models/Product';
import StockMovement from '@/models/StockMovement';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';

/**
 * Stock Management Service
 * Handles all stock operations with proper validation and logging
 */
export const StockService = {
    /**
     * Reduce stock when creating a sale (invoice)
     * Stock is ALWAYS reduced from SHOP
     */
    async reduceStockForSale(items, invoiceId, userId) {
        const results = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                throw new Error(`المنتج غير موجود: ${item.productId}`);
            }

            // Validate shop stock availability
            if (product.shopQty < item.qty) {
                throw new Error(
                    `كمية غير كافية في المحل: ${product.name}. ` +
                    `المتوفر: ${product.shopQty}, المطلوب: ${item.qty}`
                );
            }

            // Reduce shop quantity
            product.shopQty -= item.qty;
            product.stockQty = product.warehouseQty + product.shopQty;
            await product.save();

            // Log movement
            const movement = await StockMovement.create({
                productId: item.productId,
                type: 'SALE',
                qty: item.qty,
                note: `بيع - فاتورة #${invoiceId}`,
                refId: invoiceId,
                createdBy: userId,
                snapshot: {
                    warehouseQty: product.warehouseQty,
                    shopQty: product.shopQty
                }
            });

            results.push({ product, movement });
        }

        return results;
    },

    /**
     * Increase stock when receiving purchase order
     * Stock is ALWAYS added to WAREHOUSE
     * IMPLEMENTS: Weighted Average Cost (AVCO)
     */
    async increaseStockForPurchase(items, poId, userId) {
        const results = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                throw new Error(`المنتج غير موجود: ${item.productId}`);
            }

            // Calculate Weighted Average Cost
            // Current Value = Current Stock * Current Buy Price
            // New Value = New Qty * New Cost Price
            // New Buy Price = (Current Value + New Value) / (Current Stock + New Qty)

            const currentStock = product.stockQty || 0;
            const currentCost = product.buyPrice || 0;
            const newQty = item.quantity;
            const newCost = item.costPrice || currentCost; // If no cost provided, assume current cost

            // Protect against zero division or negative stock anomalies
            let newAvgCost = currentCost;

            if (currentStock + newQty > 0) {
                const totalValue = (currentStock * currentCost) + (newQty * newCost);
                newAvgCost = totalValue / (currentStock + newQty);
            }

            // Update Stock
            product.warehouseQty = (product.warehouseQty || 0) + newQty;
            product.stockQty = (product.warehouseQty || 0) + (product.shopQty || 0);

            // Update Cost
            // We round to 2 decimal places to avoid floating point weirdness, 
            // but for high precision systems maybe keep more. 2 is standard for currency.
            product.buyPrice = parseFloat(newAvgCost.toFixed(2));

            await product.save();

            // Log movement
            const movement = await StockMovement.create({
                productId: item.productId,
                type: 'IN',
                qty: newQty,
                note: `شراء - أمر #${poId} (Cost: ${newCost}, NewAvg: ${product.buyPrice})`,
                refId: poId,
                createdBy: userId,
                snapshot: {
                    warehouseQty: product.warehouseQty,
                    shopQty: product.shopQty
                }
            });

            results.push({ product, movement, newAvgCost: product.buyPrice });
        }

        return results;
    },

    /**
     * Transfer stock from warehouse to shop
     */
    async transferToShop(productId, quantity, userId, note = '') {
        const product = await Product.findById(productId);

        if (!product) {
            throw new Error('المنتج غير موجود');
        }

        if (product.warehouseQty < quantity) {
            throw new Error(
                `كمية غير كافية في المخزن. المتوفر: ${product.warehouseQty}, المطلوب: ${quantity}`
            );
        }

        // Transfer
        product.warehouseQty -= quantity;
        product.shopQty += quantity;
        // Total stock remains same
        await product.save();

        // Log movement
        const movement = await StockMovement.create({
            productId,
            type: 'TRANSFER_TO_SHOP',
            qty: quantity,
            note: note || 'تحويل من المخزن إلى المحل',
            createdBy: userId,
            snapshot: {
                warehouseQty: product.warehouseQty,
                shopQty: product.shopQty
            }
        });

        return { product, movement };
    },

    /**
     * Transfer stock from shop to warehouse
     */
    async transferToWarehouse(productId, quantity, userId, note = '') {
        const product = await Product.findById(productId);

        if (!product) {
            throw new Error('المنتج غير موجود');
        }

        if (product.shopQty < quantity) {
            throw new Error(
                `كمية غير كافية في المحل. المتوفر: ${product.shopQty}, المطلوب: ${quantity}`
            );
        }

        // Transfer
        product.shopQty -= quantity;
        product.warehouseQty += quantity;
        await product.save();

        // Log movement
        const movement = await StockMovement.create({
            productId,
            type: 'TRANSFER_TO_WAREHOUSE',
            qty: quantity,
            note: note || 'تحويل من المحل إلى المخزن',
            createdBy: userId,
            snapshot: {
                warehouseQty: product.warehouseQty,
                shopQty: product.shopQty
            }
        });

        return { product, movement };
    },

    /**
     * Adjust stock quantities (for inventory audits)
     */
    async adjustStock(productId, newWarehouseQty, newShopQty, reason, userId) {
        const product = await Product.findById(productId);

        if (!product) {
            throw new Error('المنتج غير موجود');
        }

        const oldWarehouseQty = product.warehouseQty;
        const oldShopQty = product.shopQty;

        // Set new quantities
        product.warehouseQty = newWarehouseQty;
        product.shopQty = newShopQty;
        product.stockQty = newWarehouseQty + newShopQty;
        await product.save();

        const warehouseDiff = newWarehouseQty - oldWarehouseQty;
        const shopDiff = newShopQty - oldShopQty;

        // Log adjustment
        const movement = await StockMovement.create({
            productId,
            type: 'ADJUST',
            qty: Math.abs(warehouseDiff) + Math.abs(shopDiff),
            note: `تصحيح جرد: ${reason}. مخزن: ${oldWarehouseQty}→${newWarehouseQty}, محل: ${oldShopQty}→${newShopQty}`,
            createdBy: userId,
            snapshot: {
                warehouseQty: product.warehouseQty,
                shopQty: product.shopQty
            }
        });

        return { product, movement, warehouseDiff, shopDiff };
    },

    /**
     * Get stock movement history for a product
     */
    async getProductHistory(productId, limit = 50) {
        return await StockMovement.find({ productId })
            .sort({ date: -1 })
            .limit(limit)
            .populate('createdBy', 'name')
            .lean();
    },

    /**
     * Get all stock movements for a date range
     */
    async getMovements(startDate, endDate, type = null) {
        const query = {
            date: {
                $gte: startDate,
                $lte: endDate
            }
        };

        if (type) {
            query.type = type;
        }

        return await StockMovement.find(query)
            .sort({ date: -1 })
            .populate('productId', 'name code')
            .populate('createdBy', 'name')
            .lean();
    },

    /**
     * Validate stock availability for multiple items
     */
    async validateStockAvailability(items) {
        const results = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                results.push({
                    productId: item.productId,
                    available: false,
                    reason: 'المنتج غير موجود'
                });
                continue;
            }

            if (product.shopQty < item.qty) {
                results.push({
                    productId: item.productId,
                    name: product.name,
                    available: false,
                    requested: item.qty,
                    inStock: product.shopQty,
                    reason: 'كمية غير كافية'
                });
            } else {
                results.push({
                    productId: item.productId,
                    name: product.name,
                    available: true,
                    requested: item.qty,
                    inStock: product.shopQty
                });
            }
        }

        return results;
    },

    /**
     * Increase stock when returning items (Sales Return)
     * Stock is added back to SHOP (assuming returns go to front desk/shop)
     */
    async increaseStockForReturn(items, returnId, userId) {
        const results = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                console.warn(`المنتج غير موجود عند الارتجاع: ${item.productId}`);
                continue;
            }

            // Increase shop quantity
            product.shopQty += item.qty;
            product.stockQty = product.warehouseQty + product.shopQty;
            await product.save();

            // Log movement
            const movement = await StockMovement.create({
                productId: item.productId,
                type: 'IN', // Treated as IN but noted as Return
                qty: item.qty,
                note: `مرتجع مبيعات - إشعار ${returnId}`,
                refId: returnId,
                createdBy: userId,
                snapshot: {
                    warehouseQty: product.warehouseQty,
                    shopQty: product.shopQty
                }
            });

            results.push({ product, movement });
        }

        return results;
    }
};
