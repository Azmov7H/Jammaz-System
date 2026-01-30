import Customer from '@/models/Customer';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';
import dbConnect from '@/lib/db';

export const CustomerService = {
    async getAll({ page = 1, limit = 20, search }) {
        await dbConnect();

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Use standard pagination
        const skip = (page - 1) * limit;
        const [customers, total] = await Promise.all([
            Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Customer.countDocuments(query)
        ]);

        return {
            customers,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page: Number(page),
                limit: Number(limit)
            }
        };
    },

    async getById(id) {
        await dbConnect();
        const customer = await Customer.findById(id).lean();
        if (!customer) throw 'Customer not found';
        return customer;
    },

    async create(data) {
        await dbConnect();

        // Extract opening balance data
        const { openingBalance, openingBalanceType, ...customerData } = data;

        const existing = await Customer.findOne({ phone: customerData.phone });
        if (existing) {
            throw 'رقم الهاتف مستخدم بالفعل لعميل آخر';
        }

        // Initialize credit balance (pre-paid)
        let initialCreditBalance = 0;
        if (openingBalance && openingBalance > 0 && openingBalanceType === 'credit') {
            initialCreditBalance = parseFloat(openingBalance);
        }

        const customer = await Customer.create({
            ...customerData,
            balance: 0,
            creditBalance: initialCreditBalance
        });

        // Handle Opening Balance Effects
        if (openingBalance && openingBalance > 0) {
            const AccountingEntry = (await import('@/models/AccountingEntry')).default;
            const { DebtService } = await import('@/services/financial/debtService');

            if (openingBalanceType === 'debit') {
                // Customer owes us (Debit)
                // 1. Create Debt Record (Handles Customer Balance Update)
                await DebtService.createDebt({
                    debtorType: 'Customer',
                    debtorId: customer._id,
                    amount: parseFloat(openingBalance),
                    dueDate: new Date(),
                    referenceType: 'Manual',
                    referenceId: customer._id,
                    description: 'رصيد افتتاحي (مديونية سابقة)'
                });

                // 2. Create Accounting Entry
                await AccountingEntry.createEntry({
                    type: 'ADJUSTMENT',
                    debitAccount: 'Accounts Receivable', // Or specific Customer Account? Usually AR.
                    creditAccount: 'Opening Balance Equity',
                    amount: initialBalance,
                    description: `رصيد افتتاحي للعميل: ${customer.name}`,
                    refType: 'Manual',
                    refId: customer._id
                });

            } else {
                // We owe customer (Credit)
                await AccountingEntry.createEntry({
                    type: 'ADJUSTMENT',
                    debitAccount: 'Opening Balance Equity',
                    creditAccount: 'Accounts Payable', // technically Customer Deposits/Credit
                    amount: initialCreditBalance,
                    description: `رصيد افتتاحي دائن للعميل: ${customer.name}`,
                    refType: 'Manual',
                    refId: customer._id
                });
            }
        }

        revalidateTag(CACHE_TAGS.CUSTOMERS);
        return customer;
    },

    async update(id, data) {
        await dbConnect();

        if (data.phone) {
            const existing = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
            if (existing) throw 'رقم الهاتف مستخدم بالفعل لعميل آخر';
        }

        const customer = await Customer.findByIdAndUpdate(id, data, { new: true });
        if (!customer) throw 'Customer not found';

        revalidateTag(CACHE_TAGS.CUSTOMERS);
        return customer;
    },

    async delete(id) {
        await dbConnect();

        const customer = await Customer.findById(id);
        if (!customer) throw 'Customer not found';

        // Check if customer has any invoices or debts before deleting
        const Invoice = (await import('@/models/Invoice')).default;
        const Debt = (await import('@/models/Debt')).default;

        const [hasInvoices, hasDebts] = await Promise.all([
            Invoice.exists({ customer: id }),
            Debt.exists({ debtorId: id, debtorType: 'Customer' })
        ]);

        if (hasInvoices || hasDebts) {
            throw 'لا يمكن حذف العميل لوجود معاملات مالية أو فواتير مرتبطة به. يمكنك إيقاف تنشيطه بدلاً من ذلك.';
        }

        await Customer.findByIdAndDelete(id);

        revalidateTag(CACHE_TAGS.CUSTOMERS);
        return { message: 'Customer deleted permanently' };
    }
};
