import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        await dbConnect();

        // Auth
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { productId, quantity, from, to } = await request.json();

        // Validate direction
        if (from === 'warehouse' && to === 'shop') {
            // Warehouse -> Shop
            const product = await Product.findById(productId);
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

            if (product.warehouseQty < quantity) {
                return NextResponse.json({ error: `الكمية في المخزن غير كافية. المتوفر: ${product.warehouseQty}` }, { status: 400 });
            }

            // Using aggregation pipeline update for atomicity
            await Product.updateOne(
                { _id: productId },
                [
                    { $set: { warehouseQty: { $subtract: ["$warehouseQty", Number(quantity)] } } },
                    { $set: { shopQty: { $add: ["$shopQty", Number(quantity)] } } },
                    // Total remains same, but good to recalc in case of drift, logic: stock = newWarehouse + newShop
                    { $set: { stockQty: { $add: ["$warehouseQty", "$shopQty"] } } } // Note: Inside pipeline $warehouseQty refers to value AFTER previous stage?? 
                    // Actually, pipeline stages execute in order. 
                    // Stage 1: Update Warehouse. Stage 2: Update Shop. Stage 3: Calc Total.
                    // Yes, subsequent stages see updated values.
                ]
            );

        } else if (from === 'shop' && to === 'warehouse') {
            // Shop -> Warehouse
            const product = await Product.findById(productId);
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

            if (product.shopQty < quantity) {
                return NextResponse.json({ error: `الكمية في المحل غير كافية. المتوفر: ${product.shopQty}` }, { status: 400 });
            }

            await Product.updateOne(
                { _id: productId },
                [
                    { $set: { shopQty: { $subtract: ["$shopQty", Number(quantity)] } } },
                    { $set: { warehouseQty: { $add: ["$warehouseQty", Number(quantity)] } } },
                    { $set: { stockQty: { $add: ["$warehouseQty", "$shopQty"] } } }
                ]
            );
        } else {
            return NextResponse.json({ error: 'Invalid transfer direction' }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
