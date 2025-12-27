import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import SalesReturn from '@/models/SalesReturn';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { StockService } from '@/lib/services/stockService';
import { AccountingService } from '@/lib/services/accountingService';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params; // Invoice ID - await params in Next.js 15+
        const body = await request.json();
        const { items, type, refundAmount } = body;

        // 1. Fetch Invoice
        const invoice = await Invoice.findById(id);
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        // 2. Validate Items
        // Ideally, check if qty <= original sold qty
        // And check if already returned (would need to track returnedQty on Invoice Items, simpler for MVP to skip strict history check but highly recommended)
        let totalRefundCalc = 0;
        let totalCostReversal = 0;

        const returnItems = [];

        for (const item of items) {
            const originalItem = invoice.items.find(i => i.productId.toString() === item.productId);
            if (!originalItem) continue;

            const qty = parseInt(item.qty);
            if (qty <= 0) continue;

            const lineRefund = qty * originalItem.unitPrice; // Refund at original price
            totalRefundCalc += lineRefund;

            // Calculate Cost Reversal (COGS)
            const lineCost = qty * (originalItem.costPrice || 0); // Use snapshot cost
            totalCostReversal += lineCost;

            returnItems.push({
                productId: item.productId,
                qty: qty,
                unitPrice: originalItem.unitPrice,
                refundAmount: lineRefund,
                reason: item.reason || 'Customer Return'
            });
        }

        if (returnItems.length === 0) {
            return NextResponse.json({ error: 'لا توجد منتجات صالحة للارتجاع' }, { status: 400 });
        }

        // 3. Create SalesReturn Record
        const salesReturn = await SalesReturn.create({
            returnNumber: `RET-${Date.now()}`,
            originalInvoice: invoice._id,
            items: returnItems,
            totalRefund: totalRefundCalc,
            type: type || 'cash',
            createdBy: user.userId
        });

        // 4. Update Stock
        await StockService.increaseStockForReturn(returnItems, salesReturn._id, user.userId);

        // 5. Update Financials (Accounting)
        await AccountingService.createReturnEntries(salesReturn, totalCostReversal, user.userId);

        // 6. Handle Customer Balance (if credit refund)
        if (type === 'credit' && invoice.customer) {
            const customer = await Customer.findById(invoice.customer);
            if (customer) {
                // Credit refund means we reduce what they owe us (Balance decreases)
                // OR we enable them to buy more (Balance decreases if positive debt, or goes negative if wallet)
                // In our system, Balance > 0 means Debt. So Refund Credit -> Balance -= Refund Amount
                customer.balance -= totalRefundCalc;
                await customer.save();
            }
        }

        return NextResponse.json({ success: true, salesReturn });

    } catch (error) {
        console.error('Return Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
