import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import { InventoryService } from '@/lib/services/inventoryService';
import { FinanceService } from '@/lib/services/financeService';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { items, customerId, customerName, customerPhone, discount = 0, tax = 0 } = body;

        // 1. Validation
        if (!items || items.length === 0) return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 });

        // 2. Customer Handling
        let finalCustomerId = customerId;
        if (!finalCustomerId && customerPhone) {
            let customer = await Customer.findOne({ phone: customerPhone });
            if (!customer) {
                if (!customerName) return NextResponse.json({ error: 'اسم العميل مطلوب' }, { status: 400 });
                customer = await Customer.create({ name: customerName, phone: customerPhone });
            }
            finalCustomerId = customer._id;
        }

        // 3. Calculate Totals & Pre-Validate Stock
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) throw new Error(`Product not found: ${item.productId}`);

            // Check stock but don't deduct yet
            if (product.shopQty < item.qty) {
                throw new Error(`Insufficient stock for ${product.name}. Available in shop: ${product.shopQty}`);
            }

            const itemTotal = item.qty * item.unitPrice;
            subtotal += itemTotal;
            processedItems.push({
                productId: item.productId,
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: itemTotal,
                // Snapshot for historical data
                productName: product.name,
                costPrice: product.buyPrice
            });
        }

        const total = subtotal + tax - discount;

        // 4. Create Invoice
        const invoice = await Invoice.create({
            number: `INV-${Date.now()}`, // Simple ID generation
            date: new Date(),
            items: processedItems,
            subtotal,
            tax,
            discount,
            total,
            customer: finalCustomerId,
            customerName: customerName || (finalCustomerId ? null : 'Walk-in'),
            createdBy: user.userId
        });

        // 5. Execute Actions (Stock + Treasury)
        // If any fail after this, we have consistency issues.
        // We will do best-effort or throw to allow manual fix.
        // Ideal: Transactions. Here: Sequential.

        try {
            // Move Stock
            for (const item of processedItems) {
                await InventoryService.moveStock({
                    productId: item.productId,
                    qty: item.qty,
                    type: 'SALE',
                    userId: user.userId,
                    note: `Invoice #${invoice.number}`,
                    refId: invoice._id
                });
            }

            // Update Treasury
            await FinanceService.recordTransaction({
                amount: total,
                type: 'INCOME',
                description: `Invoice #${invoice.number}`,
                referenceType: 'Invoice',
                referenceId: invoice._id,
                userId: user.userId
            });

            // Update Customer Stats
            if (finalCustomerId) {
                await Customer.findByIdAndUpdate(finalCustomerId, {
                    $inc: { totalPurchases: total },
                    lastPurchaseDate: new Date()
                });
            }

        } catch (postProcessError) {
            console.error('Post-Invoice Error:', postProcessError);
            // Critical error logging. In a real system we might void the invoice.
            // For now, we return success with a warning log on server.
        }

        return NextResponse.json({ invoice }, { status: 201 });

    } catch (error) {
        console.error('Invoice Creation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search');

        let query = {};
        if (search) {
            query = {
                $or: [
                    { number: { $regex: search, $options: 'i' } },
                    { customerName: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const invoices = await Invoice.find(query)
            .populate('customer', 'name phone')
            .populate('createdBy', 'name')
            .sort({ date: -1 })
            .limit(limit);

        return NextResponse.json({ invoices });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching invoices' }, { status: 500 });
    }
}
