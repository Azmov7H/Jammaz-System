import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import SalesReturn from '@/models/SalesReturn';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import Treasury from '@/models/Treasury';
import TreasuryTransaction from '@/models/TreasuryTransaction';
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

        // 3. Update Original Invoice Items
        // Reduce quantities or remove items completely
        const updatedInvoiceItems = invoice.items.map(invoiceItem => {
            const returnItem = returnItems.find(r => r.productId.toString() === invoiceItem.productId.toString());
            if (returnItem) {
                const newQty = invoiceItem.qty - returnItem.qty;
                if (newQty > 0) {
                    return {
                        ...invoiceItem.toObject(),
                        qty: newQty,
                        total: newQty * invoiceItem.unitPrice,
                        profit: newQty * invoiceItem.unitPrice - newQty * (invoiceItem.costPrice || 0)
                    };
                }
                return null; // Remove item completely
            }
            return invoiceItem;
        }).filter(item => item !== null);

        // Recalculate invoice totals
        const newSubtotal = updatedInvoiceItems.reduce((sum, item) => sum + item.total, 0);
        const newTotal = newSubtotal + (invoice.tax || 0);
        const newTotalCost = updatedInvoiceItems.reduce((sum, item) => sum + (item.qty * (item.costPrice || 0)), 0);
        const newProfit = newTotal - newTotalCost;

        // Update invoice
        invoice.items = updatedInvoiceItems;
        invoice.subtotal = newSubtotal;
        invoice.total = newTotal;
        invoice.totalCost = newTotalCost;
        invoice.profit = newProfit;

        // Update payment amounts proportionally
        if (invoice.paidAmount > 0) {
            invoice.paidAmount = Math.max(0, invoice.paidAmount - totalRefundCalc);
        }

        await invoice.save();

        // 4. Create SalesReturn Record
        const salesReturn = await SalesReturn.create({
            returnNumber: `RET-${Date.now()}`,
            originalInvoice: invoice._id,
            items: returnItems,
            totalRefund: totalRefundCalc,
            refundMethod: refundMethod,
            customerBalanceAdded: refundMethod === 'customerBalance' ? totalRefundCalc : 0,
            treasuryDeducted: refundMethod === 'cash' ? totalRefundCalc : 0,
            type: refundMethod === 'cash' ? 'cash' : 'credit', // Legacy compatibility
            createdBy: user.userId
        });

        // 5. Update Stock - Add returned items back to inventory
        await StockService.increaseStockForReturn(returnItems, salesReturn._id, user.userId);

        // 6. Handle Refund Method
        if (refundMethod === 'cash') {
            // Deduct from treasury
            const treasury = await Treasury.findOne();
            if (treasury) {
                treasury.balance -= totalRefundCalc;
                treasury.lastUpdated = new Date();
                await treasury.save();
            }

            // Record treasury transaction
            await TreasuryTransaction.create({
                type: 'EXPENSE',
                amount: totalRefundCalc,
                description: `استرداد نقدي - فاتورة ${invoice.number}`,
                referenceType: 'Manual',
                referenceId: salesReturn._id,
                date: new Date(),
                createdBy: user.userId
            });
        } else if (refundMethod === 'customerBalance' && invoice.customer) {
            // Priority: 1. Reduce Debt (balance), 2. Add to Credit (creditBalance)
            const customer = await Customer.findById(invoice.customer);
            if (customer) {
                if (customer.balance > 0) {
                    const debtReduction = Math.min(customer.balance, totalRefundCalc);
                    customer.balance -= debtReduction;
                    const remainingRefund = totalRefundCalc - debtReduction;
                    if (remainingRefund > 0) {
                        customer.creditBalance = (customer.creditBalance || 0) + remainingRefund;
                    }
                } else {
                    customer.creditBalance = (customer.creditBalance || 0) + totalRefundCalc;
                }
                await customer.save();
            }
        }

        // 7. Create accounting entries for the return
        await AccountingService.createReturnEntries(salesReturn, totalCostReversal, user.userId);

        return NextResponse.json({
            success: true,
            salesReturn,
            updatedInvoice: {
                id: invoice._id,
                newTotal: invoice.total,
                newProfit: invoice.profit
            }
        });

    } catch (error) {
        console.error('Return Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
