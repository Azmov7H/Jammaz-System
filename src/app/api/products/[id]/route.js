import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { InventoryService } from '@/lib/services/inventoryService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const product = await Product.findById(id).populate('supplierId', 'name');

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await dbConnect();

        const user = await getCurrentUser();
        if (!user || !hasPermission(user.role, 'products:manage')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();

        // Separate stock fields from other data
        const { stockQty, warehouseQty, shopQty, sellPrice, ...updateData } = body;

        const currentProduct = await Product.findById(id);
        if (!currentProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Map sellPrice to retailPrice if provided
        if (sellPrice !== undefined) {
            updateData.retailPrice = Number(sellPrice);
        }

        // Handle Stock Adjustments via Service if detected
        let newWarehouse = warehouseQty !== undefined ? Number(warehouseQty) : currentProduct.warehouseQty;
        let newShop = shopQty !== undefined ? Number(shopQty) : currentProduct.shopQty;

        // Force Audit if values differ
        if (newWarehouse !== currentProduct.warehouseQty || newShop !== currentProduct.shopQty) {
            await InventoryService.forceAdjust(
                id,
                newWarehouse,
                newShop,
                user.userId,
                'Manual Correction via Product Edit'
            );
        }

        // Update other fields
        const finalProduct = await Product.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        return NextResponse.json(finalProduct);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user || user.role !== 'owner') { // Strict delete permission
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product deleted' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
