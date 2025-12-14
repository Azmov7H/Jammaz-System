import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import DailySales from '@/models/DailySales';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import PurchaseOrder from '@/models/PurchaseOrder';
import AccountingEntry from '@/models/AccountingEntry';
import { AccountingService } from '@/lib/services/accountingService';
import { startOfDay, startOfMonth, startOfWeek, endOfDay } from 'date-fns';

export async function GET() {
    try {
        await dbConnect();

        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const monthStart = startOfMonth(now);

        // 1. Today's Sales & Gross Profit
        const todayInvoices = await Invoice.find({
            date: { $gte: todayStart, $lte: todayEnd }
        });

        const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const todayGrossProfit = todayInvoices.reduce((sum, inv) => sum + (inv.profit || 0), 0);
        const todayInvoicesCount = todayInvoices.length;

        // 1.5 Today's Expenses (Operating)
        // Find entries where type is EXPENSE and date is today
        const todayExpensesItems = await AccountingEntry.find({
            type: 'EXPENSE',
            date: { $gte: todayStart, $lte: todayEnd }
        });
        const todayExpensesTotal = todayExpensesItems.reduce((sum, entry) => sum + entry.amount, 0);

        // Net Profit = Gross Profit - Operating Expenses
        const todayNetProfit = todayGrossProfit - todayExpensesTotal;

        // 2. Cash Balance (Using Accounting Service Ledger for "Cash")
        // Note: Ideally this comes from a dedicated Treasury model, but we use ledger balance here
        const cashLedger = await AccountingService.getLedger('الخزينة / النقدية');
        const cashBalance = cashLedger.finalBalance || 0;

        // 3. Inventory Value & Low Stock
        const products = await Product.find({});
        let totalStockValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        const lowStockProducts = [];

        for (const p of products) {
            const totalQty = (p.shopQty || 0) + (p.warehouseQty || 0);
            totalStockValue += totalQty * (p.buyPrice || 0);

            if (totalQty === 0) {
                outOfStockCount++;
            } else if (totalQty <= (p.minLevel || 5)) {
                lowStockCount++;
                lowStockProducts.push(p);
            }
        }

        // 4. Month Summary
        const monthInvoices = await Invoice.find({
            date: { $gte: monthStart }
        });
        const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const monthGrossProfit = monthInvoices.reduce((sum, inv) => sum + (inv.profit || 0), 0);

        // Month Expenses
        const monthExpensesItems = await AccountingEntry.find({
            type: 'EXPENSE',
            date: { $gte: monthStart }
        });
        const monthExpensesTotal = monthExpensesItems.reduce((sum, entry) => sum + entry.amount, 0);
        const monthNetProfit = monthGrossProfit - monthExpensesTotal;

        // 5. Financial Aggregates (Receivables & Payables)
        // Calculating total debts from Customers and Suppliers
        const customers = await Customer.find({ balance: { $ne: 0 } });
        const totalReceivables = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

        const suppliers = await Supplier.find({ balance: { $ne: 0 } });
        const totalPayables = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

        // 6. Pending POs
        const pendingPOsCount = await PurchaseOrder.countDocuments({ status: { $ne: 'RECEIVED' } });

        // 7. Recent Activity (moved down)
        const recentActivity = await Invoice.find()
            .sort({ date: -1 })
            .limit(5)
            .lean();

        return NextResponse.json({
            kpis: {
                todaySales,
                todayProfit: todayNetProfit, // Returning NET profit now
                todayGrossProfit, // Optional: return gross too if needed
                todayExpenses: todayExpensesTotal,
                todayInvoices: todayInvoicesCount,
                cashBalance,
                totalStockValue,
                lowStockCount,
                outOfStockCount,
                totalReceivables,
                totalPayables,
                pendingPOs: pendingPOsCount
            },
            monthSummary: {
                totalRevenue: monthRevenue,
                totalProfit: monthNetProfit,
                totalExpenses: monthExpensesTotal,
                totalInvoices: monthInvoices.length
            },
            recentActivity,
            lowStockProducts: lowStockProducts.slice(0, 5) // Limit to top 5
        });

    } catch (error) {
        console.error('Dashboard KPI Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
