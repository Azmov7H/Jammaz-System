import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { StockService } from '@/services/stockService';
import dbConnect from '@/lib/db';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';

export const InvoiceService = {
    async getAll({ page = 1, limit = 50, search, customerId, status }) {
        await dbConnect();
        const query = {};
        if (search) {
            query.$or = [
                { number: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }
        if (customerId) query.customer = customerId;
        if (status) query.paymentStatus = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [invoices, total] = await Promise.all([
            Invoice.find(query)
                .populate('customer', 'name phone')
                .populate('createdBy', 'name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Invoice.countDocuments(query)
        ]);

        return {
            invoices,
            pagination: {
                total,
                pages: Math.ceil(total / Number(limit)),
                page: Number(page),
                limit: Number(limit)
            }
        };
    },

    async create(data, userId) {
        await dbConnect();
        const { items, customerId, customerName, customerPhone, paymentType, tax = 0, dueDate } = data;

        // Validation logic... (simplified for restoration)
        let subtotal = 0;
        let totalCost = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) throw `المنتج غير موجود: ${item.productId}`;

            const itemTotal = item.qty * item.unitPrice;
            const lineCost = item.qty * (product.buyPrice || 0);
            const lineProfit = itemTotal - lineCost;

            subtotal += itemTotal;
            totalCost += lineCost;

            processedItems.push({
                ...item,
                productName: product.name, // Add product name for display
                costPrice: product.buyPrice,
                profit: lineProfit,
                total: itemTotal
            });
        }

        const total = subtotal + Number(tax);
        const profit = total - totalCost;

        // Get customer name if customerId is provided
        let finalCustomerName = customerName;
        let finalCustomerPhone = customerPhone;

        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (customer) {
                finalCustomerName = customer.name;
                finalCustomerPhone = customer.phone;
            }
        }

        const invoice = await Invoice.create({
            number: `INV-${Date.now()}`,
            items: processedItems,
            subtotal,
            tax,
            total,
            paymentType,
            dueDate,
            totalCost,
            profit,
            customer: customerId,
            customerName: finalCustomerName, // Add customer name for display
            customerPhone: finalCustomerPhone, // Add customer phone for display
            createdBy: userId,
            paymentStatus: paymentType === 'cash' ? 'paid' : 'pending',
            paidAmount: paymentType === 'cash' ? total : 0
        });

        // Delegate to FinanceService for orchestration (Stock, Accounting, Debt, Treasury)
        const { FinanceService } = await import('@/services/financeService');
        await FinanceService.recordSale(invoice, userId);

        revalidateTag(CACHE_TAGS.INVOICES);
        revalidateTag(CACHE_TAGS.PRODUCTS);
        return invoice;
    },
    async getById(id) {
        await dbConnect();
        const invoice = await Invoice.findById(id)
            .populate('customer', 'name phone address')
            .populate('createdBy', 'name')
            .populate('items.productId', 'name code') // Populate product details in items
            .lean();
        return invoice;
    },
    async deleteInvoice(id, userId) {
        const { FinanceService } = await import('@/services/financeService');
        return await FinanceService.reverseSale(id, userId);
    }
};
