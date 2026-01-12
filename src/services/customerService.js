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
        const existing = await Customer.findOne({ phone: data.phone });
        if (existing) {
            throw 'رقم الهاتف مستخدم بالفعل لعميل آخر';
        }

        const customer = await Customer.create(data);
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
