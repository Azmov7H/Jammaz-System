import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Supplier from '@/models/Supplier'; // Ensure registered

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            query.category = category;
        }

        const products = await Product.find(query)
            .populate('supplierId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(query);

        return NextResponse.json({
            products,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Check if code exists
        const existing = await Product.findOne({ code: body.code });
        if (existing) {
            return NextResponse.json({ error: 'Product code already exists' }, { status: 400 });
        }

        const { name, code, sellPrice, buyPrice, warehouseQty = 0, shopQty = 0, stockQty: initialStock, minLevel, brand, category } = body;

        // If warehouse/shop qty provided, use them. If only stockQty provided, assume it's all warehouse (legacy support).
        let finalWarehouse = Number(warehouseQty);
        let finalShop = Number(shopQty);

        if (initialStock && finalWarehouse === 0 && finalShop === 0) {
            finalWarehouse = Number(initialStock);
        }

        const totalStock = finalWarehouse + finalShop;

        const product = await Product.create({
            name, code, sellPrice, buyPrice,
            warehouseQty: finalWarehouse,
            shopQty: finalShop,
            stockQty: totalStock,
            minLevel, brand, category
        });
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
