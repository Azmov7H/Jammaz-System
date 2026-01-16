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

        // Initialize balance based on opening balance
        let initialBalance = 0;
        let initialCreditBalance = 0;

        if (openingBalance && openingBalance > 0) {
            if (openingBalanceType === 'debit') {
                initialBalance = parseFloat(openingBalance);
            } else {
                initialCreditBalance = parseFloat(openingBalance);
            }
        }

        const customer = await Customer.create({
            ...customerData,
            balance: initialBalance,
            creditBalance: initialCreditBalance
        });

        // Handle Opening Balance Effects
        if (openingBalance && openingBalance > 0) {
            const AccountingEntry = (await import('@/models/AccountingEntry')).default;
            const Debt = (await import('@/models/Debt')).default;

            if (openingBalanceType === 'debit') {
                // Customer owes us (Debit)
                // 1. Create Debt Record
                await Debt.create({
                    debtorType: 'Customer',
                    debtorId: customer._id,
                    originalAmount: initialBalance,
                    remainingAmount: initialBalance,
                    status: 'active',
                    dueDate: new Date(), // Immediate due for opening balance
                    referenceType: 'Manual', // or specific type? Manual fits best here.
                    referenceId: customer._id, // Linking to customer itself as text ref? actually refId needs ObjectId. Linking to self might be weird. Ideally we have an "OpeningBalance" refType.
                    // Let's use Manual and refId as customerId for now, or maybe create a dummy ref? 
                    // Validator says refType enum: 'Invoice', 'PurchaseOrder', 'Manual'
                    // Manual is fine.
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
        // Instead of hard delete, maybe soft delete or check dependencies (invoices).
        // For now, implementing simple isActive toggle if we want soft delete, or direct delete.
        // User requirements usually prefer soft delete for accounting.
        // Let's implement toggle Active/Inactive for "deletion" if business logic allows, but API generally is REST DELETE.
        // Let's check permissions in Route, here just do operation.
        // Checking task: "Reject invalid...". Let's do simple delete or isActive = false.

        const customer = await Customer.findById(id);
        if (!customer) throw 'Customer not found';

        // Soft delete logic preferred for customers with history
        customer.isActive = false;
        await customer.save();

        revalidateTag(CACHE_TAGS.CUSTOMERS);
        return { message: 'Customer deactivated' };
    }
};
