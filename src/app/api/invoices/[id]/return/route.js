import { apiHandler } from '@/lib/api-handler';
import Invoice from '@/models/Invoice';
import { getCurrentUser } from '@/lib/auth';

export const POST = apiHandler(async (request, { params }) => {
    const user = await getCurrentUser();
    if (!user) throw 'Unauthorized';

    const { id } = await params;
    const body = await request.json();
    const { items, refundMethod = 'cash' } = body;

    // 1. Fetch Invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) throw 'الفاتورة غير موجودة';

    // 2. Validate Items and Calculate Refund
    let totalRefundCalc = 0;
    let totalCostReversal = 0;
    const returnItems = [];

    for (const item of items) {
        // Match by the unique ID of the invoice item subdocument
        const originalItem = invoice.items.id(item.invoiceItemId);
        if (!originalItem) continue;

        const qty = parseInt(item.qty);
        if (qty <= 0 || qty > originalItem.qty) {
            throw `كمية غير صالحة للمنتج ${originalItem.productName}`;
        }

        const lineRefund = qty * originalItem.unitPrice;
        totalRefundCalc += lineRefund;

        const lineCost = qty * (originalItem.costPrice || 0);
        totalCostReversal += lineCost;

        returnItems.push({
            invoiceItemId: originalItem._id,
            productId: originalItem.productId, // Can be null for service items
            productName: originalItem.productName,
            qty: qty,
            unitPrice: originalItem.unitPrice,
            refundAmount: lineRefund,
            reason: item.reason || 'Customer Return'
        });
    }

    if (returnItems.length === 0) {
        throw 'لا توجد منتجات صالحة للارتجاع';
    }

    // 3. Execute Business Logic via centralized FinanceService
    const { FinanceService } = await import('@/services/financeService');

    const returnData = {
        returnItems: returnItems,
        totalRefund: totalRefundCalc,
        totalCostImpact: totalCostReversal
    };

    const result = await FinanceService.processSaleReturn(invoice, returnData, refundMethod, user.userId);

    return {
        salesReturn: result.salesReturn,
        updatedInvoice: {
            id: invoice._id,
            newTotal: result.invoice.total,
            newProfit: result.invoice.profit
        }
    };
});
