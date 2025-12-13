import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        await dbConnect();

        // 1. Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { items, customerId, customerName, customerPhone, discount = 0, tax = 0 } = body;

        // 2. Validate Inputs
        if (!items || items.length === 0) return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 });

        // 3. Customer Logic (Get Existing or Create New)
        let finalCustomerId = customerId;

        // If no ID provided but phone is present, try to find or create
        if (!finalCustomerId && customerPhone) {
            let customer = await Customer.findOne({ phone: customerPhone });
            if (!customer) {
                if (customerName) {
                    customer = await Customer.create({ name: customerName, phone: customerPhone });
                } else {
                    return NextResponse.json({ error: 'اسم العميل مطلوب للتسجيل الجديد' }, { status: 400 });
                }
            }
            finalCustomerId = customer._id;
        }

        // 4. Stock Validation & Calculations
        let subtotal = 0;
        const productUpdates = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) return NextResponse.json({ error: `المنتج غير موجود: ${item.productId}` }, { status: 400 });

            // Check Shop Stock specifically
            if (product.shopQty < item.qty) {
                return NextResponse.json({ error: `الكمية غير متوفرة في المحل للمنتج: ${product.name}. المتوفر في المحل: ${product.shopQty}` }, { status: 400 });
            }

            subtotal += item.qty * item.unitPrice;

            // Prepare update operation: Deduct from Shop, Update Total
            productUpdates.push({
                updateOne: {
                    filter: { _id: product._id },
                    update: [
                        { $set: { shopQty: { $subtract: ["$shopQty", item.qty] } } },
                        { $set: { stockQty: { $add: ["$warehouseQty", { $subtract: ["$shopQty", item.qty] }] } } } // Recalculate Total
                    ]
                }
            });
        }

        // 5. Calculate Final Total
        const total = subtotal + tax - discount;

        // 6. Execute Stock Deduction (Bulk Write)
        // Note: In a production replica set, use Transactions. Here we approximate.
        await Product.bulkWrite(productUpdates);

        // 7. Create Invoice
        const invoice = await Invoice.create({
            number: `INV-${Date.now()}`, // Simple ID generation
            date: new Date(),
            items: items.map(i => ({
                productId: i.productId,
                qty: i.qty,
                unitPrice: i.unitPrice,
                total: i.qty * i.unitPrice
            })),
            subtotal,
            tax,
            discount,
            total,
            customer: finalCustomerId,
            customerName: customerName || 'Walk-in',
            createdBy: decoded.userId
        });

        // 8. Update Customer Stats
        if (finalCustomerId) {
            await Customer.findByIdAndUpdate(finalCustomerId, {
                $inc: { totalPurchases: total },
                lastPurchaseDate: new Date()
            });
        }

        // 9. Process Treasury Transaction (Income)
        await import('@/lib/treasury').then(({ processTreasuryTransaction }) =>
            processTreasuryTransaction({
                amount: total,
                type: 'INCOME',
                description: `فاتورة مبيعات #${invoice.number}`,
                referenceType: 'Invoice',
                referenceId: invoice._id,
                userId: decoded.userId
            })
        );

        return NextResponse.json({ invoice }, { status: 201 });

    } catch (error) {
        console.error('Invoice Creation Error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || 20;
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
            .limit(parseInt(limit));

        return NextResponse.json({ invoices });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching invoices' }, { status: 500 });
    }
}
