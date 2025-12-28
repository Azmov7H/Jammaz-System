import Notification from '@/models/Notification';
import Product from '@/models/Product';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';
import InvoiceSettings from '@/models/InvoiceSettings';
import dbConnect from '@/lib/db';

export class NotificationService {
    /**
     * Syncs all system alerts based on current settings
     */
    static async syncAllAlerts() {
        await dbConnect();
        const settings = await InvoiceSettings.getSettings();

        await Promise.all([
            this.syncStockAlerts(settings),
            this.syncSupplierAlerts(settings),
            this.syncCustomerAlerts(settings),
            this.syncInactiveCustomerAlerts(settings)
        ]);
    }

    /**
     * Generates warnings for low stock (Shop and Warehouse)
     */
    static async syncStockAlerts(settings) {
        const threshold = settings.stockAlertThreshold || 5;

        // Find products where either shop or warehouse is low
        const products = await Product.find({
            isActive: true,
            $or: [
                { shopQty: { $lte: threshold } },
                { warehouseQty: { $lte: threshold } },
                { $expr: { $lte: ["$shopQty", "$minLevel"] } },
                { $expr: { $lte: ["$warehouseQty", "$minLevel"] } }
            ]
        });

        for (const product of products) {
            // 1. Check Shop Stock
            if (product.shopQty <= (product.minLevel || threshold)) {
                const title = `نقص في المحل: ${product.name}`;
                const message = `الكمية الحالية في المحل (${product.shopQty}) وصلت للحد الأدنى.`;

                const exists = await Notification.findOne({ title, isRead: false });
                if (!exists) {
                    await Notification.create({
                        title,
                        message,
                        type: 'WARNING',
                        link: `/products`
                    });
                }
            }

            // 2. Check Warehouse Stock
            if (product.warehouseQty <= (product.minLevel || threshold)) {
                const title = `نقص في المخزن: ${product.name}`;
                const message = `الكمية الحالية في المخزن (${product.warehouseQty}) وصلت للحد الأدنى.`;

                const exists = await Notification.findOne({ title, isRead: false });
                if (!exists) {
                    await Notification.create({
                        title,
                        message,
                        type: 'WARNING',
                        link: `/products`
                    });
                }
            }
        }
    }

    /**
     * Generates warnings for upcoming payments to suppliers
     */
    static async syncSupplierAlerts(settings) {
        const days = settings.supplierPaymentAlertDays || 3;
        const minAmount = settings.minDebtNotificationAmount || 0;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);

        // Check Purchase Orders that are PENDING and have an expected date soon
        // Filter by suppliers who have tracking enabled
        const pendingPOs = await PurchaseOrder.find({
            status: 'PENDING',
            totalCost: { $gte: minAmount },
            expectedDate: { $lte: targetDate, $gte: new Date() }
        }).populate({
            path: 'supplier',
            match: { financialTrackingEnabled: { $ne: false } }
        });

        for (const po of pendingPOs) {
            if (!po.supplier) continue; // Skip if supplier filtered out by match or doesn't exist
            const title = `مستحق للمورد: ${po.supplier?.name || 'غير معروف'}`;
            const message = `طلب الشراء #${po.poNumber} بقيمة ${po.totalCost.toLocaleString()} ج.م مستحق خلال ${days} أيام.`;

            const exists = await Notification.findOne({
                title,
                isRead: false
            });

            if (!exists) {
                await Notification.create({
                    title,
                    message,
                    type: 'INFO',
                    link: `/purchase-orders`,
                    actionType: 'PAY_SUPPLIER',
                    relatedId: po._id
                });
            }
        }
    }

    /**
     * Generates warnings for customer debt collection
     */
    static async syncCustomerAlerts(settings) {
        const days = settings.customerCollectionAlertDays || 3;
        const minAmount = settings.minDebtNotificationAmount || 0;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);

        // Check Invoices that are not fully paid and have a due date soon
        // Filter out customers where financialTrackingEnabled is false
        // We need to join with Customer or check if the invoice customer exists and has tracking
        const pendingInvoices = await Invoice.find({
            paymentStatus: { $in: ['pending', 'partial'] },
            total: { $gte: minAmount },
            dueDate: { $lte: targetDate, $gte: new Date() }
        }).populate({
            path: 'customerId',
            match: { financialTrackingEnabled: { $ne: false } }
        });

        for (const inv of pendingInvoices) {
            // If the invoice has no customerId (guest) or tracking is disabled, skip
            if (!inv.customerId) continue;
            const title = `تحصيل من عميل: ${inv.customerName}`;
            const message = `الفاتورة #${inv.number} بقيمة ${inv.total.toLocaleString()} ج.م مستحقة خلال ${days} أيام.`;

            const exists = await Notification.findOne({
                title,
                isRead: false
            });

            if (!exists) {
                await Notification.create({
                    title,
                    message,
                    type: 'WARNING',
                    link: `/invoices/${inv._id}`,
                    actionType: 'COLLECT_DEBT',
                    relatedId: inv._id
                });
            }
        }
    }

    /**
     * Generates alerts for customers who have not made a purchase for a while
     */
    static async syncInactiveCustomerAlerts(settings) {
        const thresholdDays = settings.inactiveCustomerThresholdDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

        // Find active customers who haven't purchased since the cutoff
        const inactiveCustomers = await require('@/models/Customer').default.find({
            isActive: true,
            lastPurchaseDate: { $lt: cutoffDate }
        });

        for (const customer of inactiveCustomers) {
            const title = `عميل منقطع: ${customer.name}`;
            const message = `لم يقم العميل بعملية شراء منذ ${thresholdDays} يوماً. آخر فاتورة كانت بتاريخ ${customer.lastPurchaseDate ? customer.lastPurchaseDate.toLocaleDateString('ar-SA') : 'لا يوجد'}.`;

            const exists = await Notification.findOne({
                title,
                isRead: false
            });

            if (!exists) {
                await Notification.create({
                    title,
                    message,
                    type: 'INFO',
                    link: `/customers`
                });
            }
        }
    }
}
