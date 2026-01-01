import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import InvoiceSettings from '@/models/InvoiceSettings';
import { StockService } from '@/lib/services/stockService';
import { FinanceService } from '@/lib/services/financeService'; // Assumed correct path
import dbConnect from '@/lib/db';

export const InvoiceService = {
    async create(data, userId) {
        await dbConnect();

        let {
            items, customerId, customerName, customerPhone,
            tax = 0, paymentType = 'cash', dueDate
        } = data;

        // Auto-set Due Date
        if (paymentType === 'credit' && !dueDate) {
            let terms = 0;
            if (customerId) {
                const customer = await Customer.findById(customerId);
                if (customer && customer.paymentTerms > 0) terms = customer.paymentTerms;
            }
            if (terms === 0) {
                const settings = await InvoiceSettings.getSettings();
                terms = settings.defaultCustomerTerms || 15;
            }
            const date = new Date();
            date.setDate(date.getDate() + terms);
            dueDate = date;
        }

        // Customer Handling
        let finalCustomerId = customerId;
        let customer = null;

        if (!finalCustomerId && customerPhone) {
            customer = await Customer.findOne({ phone: customerPhone });
            if (!customer) {
                if (!customerName) throw 'اسم العميل مطلوب';
                customer = await Customer.create({
                    name: customerName,
                    phone: customerPhone,
                    priceType: 'retail'
                });
            }
            finalCustomerId = customer._id;
        } else if (finalCustomerId) {
            customer = await Customer.findById(finalCustomerId);
        }

        // Credit Check
        if (paymentType === 'credit' && customer) {
            const invoiceTotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0) + tax;
            const limit = Number(customer.creditLimit) || 0;
            const currentBalance = Number(customer.balance) || 0;

            if (limit > 0 && (currentBalance + invoiceTotal) > limit) {
                throw `تجاوز حد الائتمان. الرصيد الحالي: ${currentBalance}, الحد المسموح: ${limit}`;
            }
        }

        // Stock Validation
        const stockValidation = await StockService.validateStockAvailability(items.map(i => ({ ...i, productId: i.productId })));
        const unavailable = stockValidation.filter(v => !v.available);
        if (unavailable.length > 0) {
            throw { message: 'منتجات غير متوفرة', unavailableItems: unavailable };
        }

        // Calculations
        let subtotal = 0;
        let totalCost = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            // Re-validate existence
            if (!product) throw `المنتج غير موجود: ${item.productId}`;

            const itemTotal = item.qty * item.unitPrice;
            const lineCost = item.qty * product.buyPrice;
            const lineProfit = itemTotal - lineCost;

            subtotal += itemTotal;
            totalCost += lineCost;

            processedItems.push({
                productId: item.productId,
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: itemTotal,
                costPrice: product.buyPrice,
                profit: lineProfit
            });
        }

        const total = subtotal + tax;
        const totalProfit = total - totalCost;

        let appliedCredit = 0;
        if (customer && customer.creditBalance > 0) {
            appliedCredit = Math.min(total, customer.creditBalance);
            customer.creditBalance -= appliedCredit;
            await customer.save();
        }

        const invoice = await Invoice.create({
            number: `INV-${Date.now()}`,
            date: new Date(),
            items: processedItems,
            subtotal,
            tax,
            total,
            usedCreditBalance: appliedCredit,
            totalCost,
            profit: totalProfit,
            paymentType,
            paymentStatus: (paymentType === 'cash' && (appliedCredit >= total)) ? 'paid' : (paymentType === 'cash' ? 'partial' : 'pending'),
            paidAmount: paymentType === 'cash' ? total : appliedCredit,
            dueDate: paymentType === 'credit' && dueDate ? new Date(dueDate) : null,
            customer: finalCustomerId,
            customerName: customerName || (customer ? customer.name : 'عميل'),
            customerPriceType: customer ? customer.priceType : 'retail',
            createdBy: userId
        });

        // Finance Processing
        try {
            await FinanceService.recordSale(invoice, userId);
        } catch (e) {
            // Log silent error or return warning? Service shouldn't crash if financial record fails but invoice is made
            console.error('Finance Record Error:', e);
            // Return invoice with warning property attached if needed, or just let it pass
        }

        return invoice;
    },

    async getAll({ page = 1, limit = 50, search }) {
        await dbConnect();

        const query = {};
        if (search) {
            query.$or = [
                { number: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const [invoices, total] = await Promise.all([
            Invoice.find(query)
                .populate('customer', 'name phone')
                .populate('createdBy', 'name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Invoice.countDocuments(query)
        ]);

        return {
            invoices,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page: Number(page),
                limit: Number(limit)
            }
        };
    }
};
