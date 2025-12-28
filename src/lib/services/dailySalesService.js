import DailySales from '@/models/DailySales';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';

/**
 * Daily Sales Tracking Service
 * Handles daily sales summary calculations
 */
export const DailySalesService = {
    /**
     * Update daily sales summary when invoice is created
     */
    async updateDailySales(invoice, userId) {
        const startOfDay = new Date(invoice.date);
        startOfDay.setHours(0, 0, 0, 0);

        // Find or create daily sales record
        let dailySales = await DailySales.findOne({ date: startOfDay });

        if (!dailySales) {
            dailySales = await DailySales.create({
                date: startOfDay,
                totalRevenue: 0,
                totalCost: 0,
                invoiceCount: 0,
                itemsSold: 0,
                cashReceived: 0,
                invoices: [],
                topProducts: []
            });
        }

        // Update totals using pre-calculated values from invoice
        dailySales.totalRevenue += invoice.total;
        dailySales.totalCost += (invoice.totalCost || 0);

        for (const item of invoice.items) {
            dailySales.itemsSold += item.qty;

            // Update top products using item snapshot
            const existingProduct = dailySales.topProducts.find(
                p => p.productId.toString() === item.productId.toString()
            );

            if (existingProduct) {
                existingProduct.quantitySold += item.qty;
                existingProduct.revenue += item.total;
            } else {
                dailySales.topProducts.push({
                    productId: item.productId,
                    name: item.name || 'Product', // Should be populated if possible, or we might need one lookup if name is missing
                    quantitySold: item.qty,
                    revenue: item.total
                });
            }
        }

        if (invoice.paymentType === 'credit') {
            dailySales.creditSales = (dailySales.creditSales || 0) + invoice.total;
        } else {
            dailySales.cashReceived += invoice.total;
        }

        dailySales.invoiceCount += 1;
        dailySales.invoices.push(invoice._id);

        // Sort top products by revenue
        dailySales.topProducts.sort((a, b) => b.revenue - a.revenue);
        // Keep only top 10
        dailySales.topProducts = dailySales.topProducts.slice(0, 10);

        dailySales.updatedBy = userId;
        await dailySales.save();

        return dailySales;
    },

    /**
     * Get daily sales for a specific date
     */
    async getDailySales(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        return await DailySales.findOne({ date: startOfDay })
            .populate('invoices')
            .populate('topProducts.productId', 'name code')
            .lean();
    },

    /**
     * Get sales summary for date range
     */
    async getSalesSummary(startDate, endDate) {
        const sales = await DailySales.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .sort({ date: -1 })
            .lean();

        // Calculate totals
        const summary = {
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            totalInvoices: 0,
            totalItems: 0,
            dailyBreakdown: sales
        };

        sales.forEach(day => {
            summary.totalRevenue += day.totalRevenue;
            summary.totalCost += day.totalCost;
            summary.totalProfit += day.grossProfit;
            summary.totalInvoices += day.invoiceCount;
            summary.totalItems += day.itemsSold;
        });

        return summary;
    },

    /**
     * Get best selling products for date range
     */
    async getBestSellers(startDate, endDate, limit = 10) {
        const sales = await DailySales.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).lean();

        const productMap = new Map();

        sales.forEach(day => {
            day.topProducts.forEach(product => {
                const key = product.productId.toString();
                if (productMap.has(key)) {
                    const existing = productMap.get(key);
                    existing.quantitySold += product.quantitySold;
                    existing.revenue += product.revenue;
                } else {
                    productMap.set(key, {
                        productId: product.productId,
                        name: product.name,
                        quantitySold: product.quantitySold,
                        revenue: product.revenue
                    });
                }
            });
        });

        const bestSellers = Array.from(productMap.values());
        bestSellers.sort((a, b) => b.revenue - a.revenue);

        return bestSellers.slice(0, limit);
    }
};
