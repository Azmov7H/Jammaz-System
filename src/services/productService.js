import Product from '@/models/Product';
import { StockService } from '@/services/stockService';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';
import dbConnect from '@/lib/db';

export const ProductService = {
    async getAll({ page = 1, limit = 10, search, category, brand, outOfStock }) {
        await dbConnect();

        const query = { isActive: true };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }
        if (category && category !== 'all') query.category = category;
        if (brand && brand !== 'all') query.brand = brand;
        if (outOfStock === 'true') query.stockQty = { $lte: 0 };

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            Product.countDocuments(query)
        ]);

        return {
            products,
            pagination: {
                total,
                pages: Math.ceil(total / Number(limit)),
                page: Number(page),
                limit: Number(limit)
            }
        };
    },

    async getById(id) {
        await dbConnect();
        const product = await Product.findById(id).lean();
        if (!product) throw 'Product not found';
        return product;
    },

    async create(data, userId) {
        await dbConnect();
        const existing = await Product.findOne({ code: data.code });
        if (existing) throw 'كود المنتج موجود مسبقاً';

        const product = await Product.create({
            ...data,
            createdBy: userId
        });

        // Register initial stock if provided
        if ((Number(data.warehouseQty) || 0) + (Number(data.shopQty) || 0) > 0) {
            await StockService.registerInitialBalance(
                product._id,
                Number(data.warehouseQty) || 0,
                Number(data.shopQty) || 0,
                Number(data.buyPrice) || 0,
                userId
            );
        }

        revalidateTag(CACHE_TAGS.PRODUCTS);
        return product;
    },

    async update(id, data, userId) {
        await dbConnect();
        if (data.code) {
            const existing = await Product.findOne({ code: data.code, _id: { $ne: id } });
            if (existing) throw 'كود المنتج موجود بالفعل لمنتج آخر';
        }

        const product = await Product.findByIdAndUpdate(id, data, { new: true });
        if (!product) throw 'Product not found';

        revalidateTag(CACHE_TAGS.PRODUCTS);
        return product;
    },

    async delete(id) {
        await dbConnect();
        const product = await Product.findById(id);
        if (!product) throw 'Product not found';

        product.isActive = false;
        await product.save();

        revalidateTag(CACHE_TAGS.PRODUCTS);
        return { message: 'Product deactivated' };
    },

    async getMetadata() {
        await dbConnect();
        const [brands, categories] = await Promise.all([
            Product.distinct('brand', { isActive: true }),
            Product.distinct('category', { isActive: true })
        ]);

        return {
            brands: brands.filter(Boolean).map(b => ({ label: b, value: b })),
            categories: categories.filter(Boolean).map(c => ({ label: c, value: c }))
        };
    }
};
