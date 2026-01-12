import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import SalesReturn from '@/models/SalesReturn';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import Treasury from '@/models/Treasury';
import TreasuryTransaction from '@/models/TreasuryTransaction';
import { StockService } from '@/services/stockService';
import { AccountingService } from '@/services/accountingService';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params; // Invoice ID - await params in Next.js 15+
        const body = await request.json();
        const { items, refundMethod = 'cash' } = body;

        // 1. Fetch Invoice
        const invoice = await Invoice.findById(id);
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        // 2. Validate Items and Calculate Refund
        let totalRefundCalc = 0;
        let totalCostReversal = 0;
        const returnItems = [];

        for (const item of items) {
            const originalItem = invoice.items.find(i => i.productId.toString() === item.productId);
            if (!originalItem) continue;

            const qty = parseInt(item.qty);
            if (qty <= 0 || qty > originalItem.qty) {
                return NextResponse.json({
                    error: `كمية غير صالحة للمنتج ${originalItem.productId}`
                }, { status: 400 });
            }

            const lineRefund = qty * originalItem.unitPrice;
            totalRefundCalc += lineRefund;

            const lineCost = qty * (originalItem.costPrice || 0);
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

        // 3. Execute Business Logic via centralized FinanceService
        try {
            const { FinanceService } = await import('@/services/financeService');

            const returnData = {
                returnItems: returnItems,
                totalRefund: totalRefundCalc,
                totalCostImpact: totalCostReversal
            };

            const result = await FinanceService.processSaleReturn(invoice, returnData, refundMethod, user.userId);

            return NextResponse.json({
                success: true,
                salesReturn: result.salesReturn,
                updatedInvoice: {
                    id: invoice._id,
                    newTotal: result.invoice.total,
                    newProfit: result.invoice.profit
                }
            });
        } catch (procErr) {
            console.error('❌ Post-Return Processing Error:', procErr);
            return NextResponse.json({ error: 'حدث خطأ أثناء معالجة البيانات المالية للمرتجع' }, { status: 500 });
        }

    } catch (error) {
        console.error('Return Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
