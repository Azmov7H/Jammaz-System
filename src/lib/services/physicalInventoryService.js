import PhysicalInventory from '@/models/PhysicalInventory';
import Product from '@/models/Product';
import { StockService } from './stockService';
import { AccountingService } from './accountingService';
import { LogService } from './logService';
import dbConnect from '@/lib/db';

/**
 * Physical Inventory Service
 * Handles physical stock counts and reconciliation
 */
export const PhysicalInventoryService = {
    /**
     * Create a new physical inventory count
     */
    async createCount(location, userId) {
        await dbConnect();

        // Load all products
        const products = await Product.find({ isActive: true })
            .select('_id name code warehouseQty shopQty buyPrice')
            .lean();

        // Prepare items based on location
        const items = products.map(product => {
            let systemQty = 0;

            if (location === 'warehouse') {
                systemQty = product.warehouseQty || 0;
            } else if (location === 'shop') {
                systemQty = product.shopQty || 0;
            } else if (location === 'both') {
                systemQty = (product.warehouseQty || 0) + (product.shopQty || 0);
            }

            return {
                productId: product._id,
                productName: product.name,
                productCode: product.code,
                systemQty,
                actualQty: systemQty, // Default to system qty
                buyPrice: product.buyPrice
            };
        });

        const count = await PhysicalInventory.create({
            date: new Date(),
            location,
            items,
            status: 'draft',
            createdBy: userId
        });

        return count;
    },

    /**
     * Update actual quantities in a count
     */
    async updateActualQuantities(countId, itemUpdates, userId) {
        await dbConnect();

        const count = await PhysicalInventory.findById(countId);

        if (!count) {
            throw new Error('سجل الجرد غير موجود');
        }

        if (count.status !== 'draft') {
            throw new Error('لا يمكن تعديل جرد مكتمل');
        }

        // Update actual quantities
        for (const update of itemUpdates) {
            const item = count.items.find(
                i => i.productId.toString() === update.productId.toString()
            );

            if (item) {
                item.actualQty = update.actualQty;
                if (update.reason) {
                    item.reason = update.reason;
                }
            }
        }

        await count.save();

        return count;
    },

    /**
     * Calculate discrepancies for a count
     */
    async calculateDiscrepancies(countId) {
        await dbConnect();

        const count = await PhysicalInventory.findById(countId);

        if (!count) {
            throw new Error('سجل الجرد غير موجود');
        }

        const discrepancies = count.items
            .filter(item => item.difference !== 0)
            .map(item => ({
                productId: item.productId,
                productName: item.productName,
                productCode: item.productCode,
                systemQty: item.systemQty,
                actualQty: item.actualQty,
                difference: item.difference,
                value: item.value,
                reason: item.reason
            }));

        return {
            totalShortage: count.totalShortage,
            totalSurplus: count.totalSurplus,
            netDifference: count.netDifference,
            valueImpact: count.valueImpact,
            discrepancies
        };
    },

    /**
     * Complete count and generate adjustments
     */
    async completeCount(countId, userId) {
        await dbConnect();

        const count = await PhysicalInventory.findById(countId).populate('items.productId');

        if (!count) {
            throw new Error('سجل الجرد غير موجود');
        }

        if (count.status !== 'draft') {
            throw new Error('الجرد مكتمل بالفعل');
        }

        // Complete the count
        await count.complete(userId);

        // [NEW] Log Action
        await LogService.logAction({
            userId,
            action: 'COMPLETE_INVENTORY',
            entity: 'PhysicalInventory',
            entityId: count._id,
            diff: { valueImpact: count.valueImpact, netDifference: count.netDifference },
            note: `Inventory count completed for ${count.location}`
        });

        // Generate stock adjustments for discrepancies
        const adjustments = [];

        for (const item of count.items) {
            if (item.difference !== 0) {
                const product = await Product.findById(item.productId);

                if (!product) continue;

                let newWarehouseQty = product.warehouseQty;
                let newShopQty = product.shopQty;

                // Adjust based on location
                if (count.location === 'warehouse') {
                    newWarehouseQty = item.actualQty;
                } else if (count.location === 'shop') {
                    newShopQty = item.actualQty;
                } else if (count.location === 'both') {
                    // Proportional adjustment (simplified)
                    const ratio = product.warehouseQty / (product.warehouseQty + product.shopQty);
                    newWarehouseQty = Math.round(item.actualQty * ratio);
                    newShopQty = item.actualQty - newWarehouseQty;
                }

                // Use stock service to adjust
                const adjustment = await StockService.adjustStock(
                    item.productId,
                    newWarehouseQty,
                    newShopQty,
                    `جرد فعلي - ${item.reason || 'تصحيح الكمية'}`,
                    userId
                );

                adjustments.push(adjustment);
            }
        }

        // Create accounting entries
        await AccountingService.createInventoryAdjustmentEntries(count, userId);

        return {
            count,
            adjustments,
            totalAdjustments: adjustments.length
        };
    },

    /**
     * Get all physical counts with filters
     */
    async getCounts({ location, status, startDate, endDate } = {}) {
        await dbConnect();

        const query = {};

        if (location) query.location = location;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        return await PhysicalInventory.find(query)
            .sort({ date: -1 })
            .populate('createdBy', 'name')
            .populate('approvedBy', 'name')
            .lean();
    },

    /**
     * Get count by ID with full details
     */
    async getCountById(countId) {
        await dbConnect();

        return await PhysicalInventory.findById(countId)
            .populate('items.productId', 'name code')
            .populate('createdBy', 'name')
            .populate('approvedBy', 'name')
            .lean();
    },

    /**
     * Delete a draft count
     */
    async deleteCount(countId, userId) {
        await dbConnect();

        const count = await PhysicalInventory.findById(countId);

        if (!count) {
            throw new Error('سجل الجرد غير موجود');
        }

        if (count.status !== 'draft') {
            throw new Error('لا يمكن حذف جرد مكتمل');
        }

        await PhysicalInventory.findByIdAndDelete(countId);

        return { success: true };
    },

    /**
     * Generate physical inventory report
     */
    async generateReport(countId) {
        await dbConnect();

        const count = await this.getCountById(countId);

        if (!count) {
            throw new Error('سجل الجرد غير موجود');
        }

        const discrepancies = count.items.filter(item => item.difference !== 0);
        const shortages = discrepancies.filter(item => item.difference < 0);
        const surpluses = discrepancies.filter(item => item.difference > 0);

        return {
            count,
            summary: {
                totalItems: count.items.length,
                totalDiscrepancies: discrepancies.length,
                shortages: shortages.length,
                surpluses: surpluses.length,
                totalShortage: count.totalShortage,
                totalSurplus: count.totalSurplus,
                netDifference: count.netDifference,
                valueImpact: count.valueImpact
            },
            discrepancies: discrepancies.map(item => ({
                productName: item.productName,
                productCode: item.productCode,
                systemQty: item.systemQty,
                actualQty: item.actualQty,
                difference: item.difference,
                value: item.value,
                reason: item.reason
            }))
        };
    }
};
