import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Supplier from '@/models/Supplier';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, getProductFilterInternal } from '@/lib/permissions';

export async function GET(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        // Note: Public viewing might be allowed if no token, but let's assume login required for now based on middleware
        // If user is null (public), we might return empty or restricted. Let's assume Viewer role if public validation fails but route is open? 
        // Middleware protects /api, so user should exist if valid.

        const role = user?.role || 'viewer';
        const roleFilter = getProductFilterInternal(role);

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const query = { ...roleFilter }; // Apply Role Filter

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
        const user = await getCurrentUser();
        if (!user || !hasPermission(user.role, 'products:manage')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Check if code exists
        const existing = await Product.findOne({ code: body.code });
        if (existing) {
            return NextResponse.json({ error: 'Product code already exists' }, { status: 400 });
        }

        const { name, code, sellPrice, buyPrice, warehouseQty = 0, shopQty = 0, stockQty: initialStock, minLevel, brand, category } = body;

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
