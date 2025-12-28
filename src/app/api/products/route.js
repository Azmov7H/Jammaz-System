import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Supplier from '@/models/Supplier';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, getProductFilterInternal } from '@/lib/permissions';
import { StockService } from '@/lib/services/stockService';

export async function GET(request) {
    // ... existing GET remains unchanged ...
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

        const {
            name, code, sellPrice, buyPrice,
            warehouseQty = 0, shopQty = 0,
            minLevel, brand, category, subsection, size, color, gender, season, unit,
            minProfitMargin = 0
        } = body;

        const finalWarehouse = Number(warehouseQty);
        const finalShop = Number(shopQty);
        const totalStock = finalWarehouse + finalShop;

        const product = await Product.create({
            name, code,
            retailPrice: Number(sellPrice), // sellPrice mapped to retailPrice
            buyPrice: Number(buyPrice),
            warehouseQty: finalWarehouse,
            shopQty: finalShop,
            stockQty: totalStock,
            openingWarehouseQty: finalWarehouse,
            openingShopQty: finalShop,
            openingBuyPrice: Number(buyPrice),
            minLevel, brand, category, subsection, size, color, gender, season, unit,
            minProfitMargin
        });

        // Register initial balance in stock movements if any quantity exists
        if (totalStock > 0) {
            await StockService.registerInitialBalance(
                product._id,
                finalWarehouse,
                finalShop,
                Number(buyPrice),
                user.userId
            );
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
