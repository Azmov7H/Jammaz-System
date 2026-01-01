import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import PurchaseOrder from '@/models/PurchaseOrder';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import { differenceInDays } from 'date-fns';

/**
 * Debt Service
 * Logic for managing, aging, and risk-analyzing business debts and payables.
 */
export const DebtService = {
    /**
     * Get aggregate debt overview for the dashboard
     */
    async getDebtOverview() {
        await dbConnect();

        const [receivables, payables] = await Promise.all([
            this.getReceivablesAging(),
            this.getPayablesAging()
        ]);

        const totalReceivables = receivables.total;
        const totalPayables = payables.total;

        // Liquidity Pulse: Ratio of what's coming in vs what's going out
        const liquidityPulse = totalPayables > 0 ? (totalReceivables / totalPayables).toFixed(2) : totalReceivables;

        return {
            receivables,
            payables,
            totalNet: totalReceivables - totalPayables,
            liquidityPulse,
            riskScore: this.calculateGlobalRisk(receivables, payables)
        };
    },

    /**
     * Analyze Customer Receivables by Aging Tiers
     */
    async getReceivablesAging() {
        await dbConnect();
        const now = new Date();

        // Find all invoices with remaining balance
        const invoices = await Invoice.find({
            paymentStatus: { $in: ['pending', 'partial'] },
            total: { $gt: 0 }
        }).populate('customer', 'name creditLimit').lean();

        const tiers = {
            current: { amount: 0, count: 0 }, // Not yet due
            tier1: { amount: 0, count: 0 },   // 1-30 days overdue
            tier2: { amount: 0, count: 0 },   // 31-60 days overdue
            tier3: { amount: 0, count: 0 }    // 60+ days overdue
        };

        const invoicesByCustomer = {};

        invoices.forEach(inv => {
            const balance = inv.total - inv.paidAmount;
            if (balance <= 0) return;

            const dueDate = inv.dueDate || inv.date;
            const daysOverdue = differenceInDays(now, dueDate);

            let tier = 'current';
            if (daysOverdue > 60) tier = 'tier3';
            else if (daysOverdue > 30) tier = 'tier2';
            else if (daysOverdue > 0) tier = 'tier1';

            tiers[tier].amount += balance;
            tiers[tier].count += 1;

            // Group by customer for risk analysis
            const cId = inv.customer?._id?.toString() || 'anonymous';
            if (!invoicesByCustomer[cId]) {
                invoicesByCustomer[cId] = {
                    _id: cId,
                    name: inv.customer?.name || inv.customerName,
                    totalDebt: 0,
                    oldestInvoiceDays: 0,
                    creditLimit: inv.customer?.creditLimit || 0,
                    invoices: []
                };
            }
            invoicesByCustomer[cId].totalDebt += balance;
            invoicesByCustomer[cId].oldestInvoiceDays = Math.max(invoicesByCustomer[cId].oldestInvoiceDays, daysOverdue);
            invoicesByCustomer[cId].invoices.push({ ...inv, balance, daysOverdue });
        });

        const validCustomers = Object.values(invoicesByCustomer)
            .filter(c => c._id && c._id !== 'anonymous')
            .sort((a, b) => b.totalDebt - a.totalDebt);

        return {
            total: Object.values(tiers).reduce((sum, t) => sum + t.amount, 0),
            tiers,
            byCustomer: validCustomers
        };
    },

    /**
     * Analyze Supplier Payables (Purchase Orders on Credit)
     */
    async getPayablesAging() {
        await dbConnect();
        const now = new Date();

        // Find POs on credit that are not fully paid
        const pos = await PurchaseOrder.find({
            paymentType: 'credit',
            status: 'RECEIVED',
            paymentStatus: { $in: ['pending', 'partial'] }
        }).populate('supplier', 'name').lean();

        const tiers = {
            current: { amount: 0, count: 0 },
            tier1: { amount: 0, count: 0 },
            tier2: { amount: 0, count: 0 },
            tier3: { amount: 0, count: 0 }
        };

        const bySupplier = {};

        pos.forEach(po => {
            const balance = po.totalCost - (po.paidAmount || 0);
            if (balance <= 0) return;

            const dueDate = po.receivedDate;
            const daysPast = differenceInDays(now, dueDate);

            let tier = 'current';
            if (daysPast > 60) tier = 'tier3';
            else if (daysPast > 30) tier = 'tier2';
            else if (daysPast > 0) tier = 'tier1';

            tiers[tier].amount += balance;
            tiers[tier].count += 1;

            const sId = po.supplier?._id?.toString() || 'unknown';
            if (!bySupplier[sId]) {
                bySupplier[sId] = {
                    _id: sId,
                    name: po.supplier?.name || 'Unknown Supplier',
                    totalDebt: 0,
                    oldestPODays: 0,
                    pos: []
                };
            }
            bySupplier[sId].totalDebt += balance;
            bySupplier[sId].oldestPODays = Math.max(bySupplier[sId].oldestPODays, daysPast);
            bySupplier[sId].pos.push({ ...po, balance, daysPast });
        });

        const validSuppliers = Object.values(bySupplier)
            .filter(s => s._id && s._id !== 'unknown')
            .sort((a, b) => b.totalDebt - a.totalDebt);

        return {
            total: Object.values(tiers).reduce((sum, t) => sum + t.amount, 0),
            tiers,
            bySupplier: validSuppliers
        };
    },

    calculateGlobalRisk(receivables, payables) {
        // High risk if receivables are heavily tilted towards Tier 3 (60+ days)
        const total = receivables.total || 1;
        const tier3Ratio = (receivables.tiers.tier3.amount / total);

        if (tier3Ratio > 0.4) return 'CRITICAL';
        if (tier3Ratio > 0.2) return 'WARNING';
        return 'HEALTHY';
    }
};
