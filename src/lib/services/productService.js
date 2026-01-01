import Product from '@/models/Product';
import { StockService } from '@/lib/services/stockService';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';
import dbConnect from '@/lib/db';

export const ProductService = {
    async getAll({ page = 1, limit = 10, search, category, brand, outOfStock }) {
        await dbConnect();

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }
        if (category && category !== 'all') query.category = category;
        if (brand && brand !== 'all') query.brand = brand;
        if (outOfStock === 'true') query.stockQty = 0;

        // Use cached method if available and no specific filters prevent it, 
        // OR just plain find for now to be safe with standard mongoose.
        // Assuming getAllCached exists on Model as per previous check.
        // But for complexity, efficient filtering is better done on DB directly.

        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            // Retaining existing optimized code with lean()
            Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Product.countDocuments(query)
        ]);

        return {
            products,
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
        const product = await Product.findById(id).lean();
        if (!product) throw 'Product not found';
        return product;
    },

    async create(data, userId) {
        await dbConnect();
        const existing = await Product.findOne({ code: data.code });
        if (existing) {
            throw 'كود المنتج موجود مسبقاً';
        }

        const {
            name, code, sellPrice, buyPrice,
            warehouseQty = 0, shopQty = 0,
            minLevel, brand, category, subsection, size, color, gender, season, unit,
            minProfitMargin = 0, images
        } = data;

        const finalWarehouse = Number(warehouseQty);
        const finalShop = Number(shopQty);
        const totalStock = finalWarehouse + finalShop;

        const product = await Product.create({
            name, code,
            retailPrice: Number(sellPrice),
            buyPrice: Number(buyPrice),
            warehouseQty: finalWarehouse,
            shopQty: finalShop,
            stockQty: totalStock,
            openingWarehouseQty: finalWarehouse,
            openingShopQty: finalShop,
            openingBuyPrice: Number(buyPrice),
            minLevel, brand, category, subsection, size, color, gender, season, unit,
            minProfitMargin,
            images,
            createdBy: userId
        });

        if (totalStock > 0) {
            await StockService.registerInitialBalance(
                product._id,
                finalWarehouse,
                finalShop,
                Number(buyPrice),
                userId
            );
        }

        revalidateTag(CACHE_TAGS.PRODUCTS);
        return product;
    },

    async update(id, data, userId) {
        await dbConnect();

        // Prevent duplicate code if code is changed
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
        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) throw 'Product not found';

        revalidateTag(CACHE_TAGS.PRODUCTS);
        return { message: 'Product deleted' };
    }
};
