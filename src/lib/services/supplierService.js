import Supplier from '@/models/Supplier';
import dbConnect from '@/lib/db';

export const SupplierService = {
    async getAll({ page = 1, limit = 20, search }) {
        await dbConnect();

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { contactName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const [suppliers, total] = await Promise.all([
            Supplier.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Supplier.countDocuments(query)
        ]);

        return {
            suppliers,
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
        const supplier = await Supplier.findById(id).lean();
        if (!supplier) throw 'Supplier not found';
        return supplier;
    },

    async create(data) {
        await dbConnect();
        const existing = await Supplier.findOne({ name: data.name });
        if (existing) {
            throw 'اسم المورد موجود بالفعل';
        }

        const supplier = await Supplier.create(data);
        return supplier;
    },

    async update(id, data) {
        await dbConnect();
        const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true });
        if (!supplier) throw 'Supplier not found';
        return supplier;
    },

    async delete(id) {
        await dbConnect();
        const supplier = await Supplier.findByIdAndDelete(id);
        if (!supplier) throw 'Supplier not found';
        return { message: 'Supplier deleted' };
    }
};
