import Notification from '@/models/Notification';
import Product from '@/models/Product';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';
import InvoiceSettings from '@/models/InvoiceSettings';
import PaymentSchedule from '@/models/PaymentSchedule';
import SystemMeta from '@/models/SystemMeta';
import dbConnect from '@/lib/db';

export class NotificationService {
    /**
     * Syncs all system alerts based on current settings
     * Implements a 5-minute cache to avoid heavy DB scans on every request
     */
    static async syncAllAlerts(force = false) {
        await dbConnect();

        if (!force) {
            const lastSync = await SystemMeta.findOne({ key: 'notifications_last_sync' }).lean();
            const now = new Date();
            // Cache for 5 minutes
            if (lastSync && lastSync.updatedAt && (now - new Date(lastSync.updatedAt)) < 5 * 60 * 1000) {
                console.log('Notification sync skipped: Cached (last sync:', lastSync.updatedAt, ')');
                return;
            }
        }

        const settings = await InvoiceSettings.getSettings();

        // RUN SEQUENTIALLY to avoid race conditions and double-creation
        await this.syncStockAlerts(settings);
        await this.syncSupplierAlerts(settings);
        await this.syncCustomerAlerts(settings);
        await this.syncInactiveCustomerAlerts(settings);
        await this.syncIntelligenceAlerts(settings);
        await this.syncDebtReminders(null, settings); // Linked to settings

        // CLEANUP: Remove duplicates on every sync to keep DB clean
        await this.cleanupDuplicates();

        // Update last sync time
        await SystemMeta.findOneAndUpdate(
            { key: 'notifications_last_sync' },
            { updatedAt: new Date() },
            { upsert: true }
        );
    }

    /**
     * Normalizes a string by trimming and collapsing multiple spaces/tabs
     */
    static normalize(str) {
        return str?.trim().replace(/\s+/g, ' ') || '';
    }

    /**
     * Removes duplicate notifications from the database
     */
    static async cleanupDuplicates() {
        console.log('Running Optimized Notification Cleanup...');
        // Find read notifications
        const notifications = await Notification.find({ isRead: true })
            .select('title relatedId createdAt')
            .sort({ createdAt: -1 })
            .lean();

        const seen = new Set();
        const toDeleteIds = [];

        for (const notif of notifications) {
            const key = `${this.normalize(notif.title)}_${notif.relatedId || 'no_id'}`;
            if (seen.has(key)) {
                toDeleteIds.push(notif._id);
            } else {
                seen.add(key);
            }
        }

        if (toDeleteIds.length > 0) {
            console.log(`Bulk Deleting ${toDeleteIds.length} duplicate notifications`);
            // Chunk deletions if there are too many, but for typical use deleteMany is fine with IDs
            await Notification.deleteMany({ _id: { $in: toDeleteIds } });
        }
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
                const title = this.normalize(`نقص في المحل: ${product.name}`);
                const message = `الكمية الحالية في المحل (${product.shopQty}) وصلت للحد الأدنى.`;

                const exists = await Notification.findOne({ title });
                if (!exists) {
                    console.log('Creating Shop Alert:', title);
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
                const title = this.normalize(`نقص في المخزن: ${product.name}`);
                const message = `الكمية الحالية في المخزن (${product.warehouseQty}) وصلت للحد الأدنى.`;

                const exists = await Notification.findOne({ title });
                if (!exists) {
                    console.log('Creating Warehouse Alert:', title);
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
            if (!po.supplier) continue;
            const title = this.normalize(`مستحق للمورد: ${po.supplier?.name || 'غير معروف'}`);
            const message = `طلب الشراء #${po.poNumber} بقيمة ${po.totalCost.toLocaleString()} ج.م مستحق خلال ${days} أيام.`;

            const exists = await Notification.findOne({
                title,
                relatedId: po._id // More specific check
            });

            if (!exists) {
                console.log('Creating Supplier Notification:', title);
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
            path: 'customer',
            match: { financialTrackingEnabled: { $ne: false } }
        });

        for (const inv of pendingInvoices) {
            if (!inv.customer) continue;
            const title = this.normalize(`تحصيل من عميل: ${inv.customerName}`);
            const message = `الفاتورة #${inv.number} بقيمة ${inv.total.toLocaleString()} ج.م مستحقة خلال ${days} أيام.`;

            const exists = await Notification.findOne({
                title,
                relatedId: inv._id // More specific check
            });

            if (!exists) {
                console.log('Creating Customer Notification:', title);
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
            const title = this.normalize(`عميل منقطع: ${customer.name}`);
            const message = `لم يقم العميل بعملية شراء منذ ${thresholdDays} يوماً. آخر فاتورة كانت بتاريخ ${customer.lastPurchaseDate ? customer.lastPurchaseDate.toLocaleDateString('ar-SA') : 'لا يوجد'}.`;

            const exists = await Notification.findOne({ title });

            if (!exists) {
                console.log('Creating Inactive Customer Notification:', title);
                await Notification.create({
                    title,
                    message,
                    type: 'INFO',
                    link: `/customers`
                });
            }
        }
    }

    /**
     * Advanced Intelligence Modules (Phase 7)
     */
    static async syncIntelligenceAlerts(settings) {
        await this.checkFinancialLiquidity();
        await this.checkStockVelocity();
        await this.checkDeadStock();
        await this.checkMarginGuard();
    }

    /**
     * Financial Intelligence: Monitor Liquidity
     */
    static async checkFinancialLiquidity() {
        const Treasury = require('@/models/Treasury').default;
        const treasury = await Treasury.findOne();
        const balance = treasury?.balance || 0;

        // Sum up POs due in next 3 days
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);

        const upcomingPOs = await PurchaseOrder.find({
            status: 'PENDING',
            expectedDate: { $lte: targetDate }
        }).lean();

        const totalNeeded = upcomingPOs.reduce((sum, po) => sum + (po.totalCost || 0), 0);

        if (totalNeeded > balance && totalNeeded > 0) {
            const title = "تنبيه السيولة المالية";
            const message = `إجمالي الالتزامات القادمة (${totalNeeded.toLocaleString()} ج.م) يتجاوز رصيد الخزينة الحالي (${balance.toLocaleString()} ج.م). يرجى تأمين السيولة.`;

            if (!(await Notification.findOne({ title, isRead: false }))) {
                await Notification.create({
                    title,
                    message,
                    type: 'ERROR',
                    category: 'CRITICAL',
                    actionType: 'VIEW_REPORT',
                    actionParams: { reportType: 'CASHFLOW' }
                });
            }
        }
    }

    /**
     * Inventory Intelligence: Predictive Stock Velocity
     */
    static async checkStockVelocity() {
        const DailySales = require('@/models/DailySales').default;

        // Calculate average sales per product in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSales = await DailySales.find({ date: { $gte: sevenDaysAgo } }).lean();

        const velocityMap = {};
        recentSales.forEach(day => {
            day.topProducts.forEach(tp => {
                velocityMap[tp.productId] = (velocityMap[tp.productId] || 0) + (tp.quantitySold / 7);
            });
        });

        // Check products with velocity
        for (const [productId, avgDailySales] of Object.entries(velocityMap)) {
            if (avgDailySales <= 0) continue;

            const product = await Product.findById(productId).lean();
            if (!product || !product.isActive) continue;

            const totalQty = (product.shopQty || 0) + (product.warehouseQty || 0);
            const daysLeft = totalQty / avgDailySales;

            if (daysLeft < 3) { // Running out in < 3 days
                const title = `توقع نفاذ مخزون: ${product.name}`;
                const message = `بناءً على معدل المبيعات، سينفذ المخزون خلال ${Math.ceil(daysLeft)} أيام. الكمية الحالية: ${totalQty}.`;

                if (!(await Notification.findOne({ title, isRead: false }))) {
                    await Notification.create({
                        title,
                        message,
                        type: 'WARNING',
                        category: 'OPPORTUNITY',
                        link: `/products/${product._id}`,
                        actionType: 'REORDER',
                        actionParams: { productId: product._id, suggestedQty: Math.ceil(avgDailySales * 14) } // Suggest 2 weeks stock
                    });
                }
            }
        }
    }

    /**
     * Inventory Intelligence: Dead Stock Detection
     */
    static async checkDeadStock() {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Find heavy stock items with no sales in 60 days
        const deadProducts = await Product.find({
            isActive: true,
            stockQty: { $gt: 10 },
            createdAt: { $lt: sixtyDaysAgo }
        }).lean();

        // This is a naive check. A better one would query invoices.
        for (const product of deadProducts) {
            const hasRecentSale = await Invoice.findOne({
                'items.productId': product._id,
                date: { $gte: sixtyDaysAgo }
            }).lean();

            if (!hasRecentSale) {
                const title = `رواكد مخزون: ${product.name}`;
                const message = `هذا الصنف لم يحقق مبيعات منذ 60 يوماً. يتوفر لديك ${product.stockQty} قطعة معطلة.`;

                if (!(await Notification.findOne({ title, isRead: false }))) {
                    await Notification.create({
                        title,
                        message,
                        type: 'INFO',
                        category: 'OPPORTUNITY',
                        actionType: 'OPTIMIZE_PRICE',
                        actionParams: { productId: product._id, currentPrice: product.retailPrice }
                    });
                }
            }
        }
    }

    /**
     * Financial Intelligence: Margin Guard
     */
    static async checkMarginGuard() {
        // Check last 10 invoices for low margins
        const recentInvoices = await Invoice.find()
            .sort({ date: -1 })
            .limit(10)
            .lean();

        for (const inv of recentInvoices) {
            const margin = (inv.profit / inv.total) * 100;
            if (margin < 5 && inv.total > 0) { // Margin < 5%
                const title = `ربحية منخفضة: فاتورة #${inv.number}`;
                const message = `نسبة الربح في هذه الفاتورة (${margin.toFixed(1)}%) أقل من الحد الآمن. يرجى مراجعة تكاليف الأصناف.`;

                if (!(await Notification.findOne({ title, isRead: false }))) {
                    await Notification.create({
                        userId: null,
                        title,
                        message,
                        type: 'WARNING',
                        category: 'INSIGHT',
                        metadata: { invoiceId: inv._id }
                    });
                }
            }
        }
    }

    /**
     * Debt & Payables Intelligence
     * Alerts for overdue invoices or upcoming PO payments
     */
    static async syncDebtReminders(userId = null, settings = null) {
        await dbConnect();

        // 0. Check for Scheduled Payments (Highest Priority)
        await this.checkScheduledPayments(userId);

        const now = new Date();

        // Fetch settings if not provided
        if (!settings) {
            settings = await InvoiceSettings.getSettings();
        }

        const minAmount = settings.minDebtNotificationAmount || 10;
        const supplierTerms = settings.defaultSupplierTerms || 30; // Default Net 30

        // 1. Overdue Invoices (Customer Debt)
        const overdueInvoices = await Invoice.find({
            paymentStatus: { $in: ['pending', 'partial'] },
            paymentType: 'credit',
            dueDate: { $lt: now },
            total: { $gte: minAmount }
        }).populate('customer', 'name phone').limit(10).lean();

        for (const inv of overdueInvoices) {
            const balance = inv.total - inv.paidAmount;
            if (balance < minAmount) continue;

            const title = this.normalize(`متأخرات سداد: ${inv.customerName}`);

            // Check if unread alert already exists
            const existing = await Notification.findOne({
                title,
                refId: inv._id,
                isRead: false
            });

            if (!existing) {
                await Notification.create({
                    userId,
                    title,
                    message: `الفاتورة رقم #${inv.number} متأخرة بمبلغ ${balance.toLocaleString()} ج.م منذ ${inv.dueDate.toLocaleDateString('ar-EG')}`,
                    type: 'CRITICAL',
                    category: 'FINANCIAL',
                    refType: 'Invoice',
                    refId: inv._id,
                    metadata: {
                        customerName: inv.customerName,
                        balance,
                        actionLabel: 'تحصيل الآن'
                    }
                });
            }
        }

        // 2. Upcoming PO Payments (Supplier Payables)
        // Check POs received more than (Terms) days ago and on credit
        // Logic: Due Date = Received Date + Supplier Terms
        // We want to alert if Now > Due Date (Overdue) OR Now is close to Due Date

        // Here we explicitly check for OVERDUE or mature debts based on global terms
        const checkDate = new Date(now.getTime() - (supplierTerms * 24 * 60 * 60 * 1000));

        const upcomingPOs = await PurchaseOrder.find({
            status: 'RECEIVED',
            paymentType: 'credit',
            receivedDate: { $lt: checkDate },
            totalCost: { $gte: minAmount }
        }).populate('supplier', 'name').limit(10).lean();

        for (const po of upcomingPOs) {
            const title = this.normalize(`استحقاق سداد مورد: ${po.supplier?.name}`);
            const existing = await Notification.findOne({
                title,
                refId: po._id,
                isRead: false
            });

            if (!existing) {
                await Notification.create({
                    userId,
                    title,
                    message: `يستحق سداد مبلغ ${po.totalCost.toLocaleString()} ج.م للمورد ${po.supplier?.name} (مرور ${supplierTerms} يوم على الاستلام)`,
                    type: 'OPPORTUNITY',
                    category: 'FINANCIAL',
                    refType: 'PurchaseOrder',
                    refId: po._id,
                    metadata: {
                        supplierName: po.supplier?.name,
                        amount: po.totalCost,
                        actionLabel: 'تسوية المديونية'
                    }
                });
            }
        }
    }

    /**
     * Check for explicit payment schedules due today or overdue
     */
    static async checkScheduledPayments(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find schedules that are PENDING and due <= today
        const dueSchedules = await PaymentSchedule.find({
            status: 'PENDING',
            dueDate: { $lte: today }
        }).populate('entityId').limit(20);

        for (const schedule of dueSchedules) {
            // Safety check if entity was deleted
            if (!schedule.entityId) continue;

            const entityName = schedule.entityId.name || 'Unknown Entity';
            const isCustomer = schedule.entityType === 'Customer';
            const title = this.normalize(isCustomer ? `استحقاق قسط: ${entityName}` : `استحقاق سداد قسط: ${entityName}`);

            // Avoid duplicate alert for same schedule
            const existing = await Notification.findOne({
                refType: 'PaymentSchedule',
                refId: schedule._id,
                isRead: false
            });

            if (!existing) {
                await Notification.create({
                    userId,
                    title,
                    message: `موعد سداد دفعة مجدولة بقيمة ${schedule.amount.toLocaleString()} ج.م (${schedule.notes || 'بدون ملاحظات'})`,
                    type: isCustomer ? 'CRITICAL' : 'WARNING', // Customer paying us is critical revenue
                    category: 'FINANCIAL',
                    refType: 'PaymentSchedule',
                    refId: schedule._id,
                    metadata: {
                        entityName,
                        amount: schedule.amount,
                        actionLabel: isCustomer ? 'تحصيل القسط' : 'سداد القسط'
                    }
                });
            }
        }
    }
}
