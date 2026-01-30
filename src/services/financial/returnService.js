import dbConnect from '@/lib/db';
import SalesReturn from '@/models/SalesReturn';
import Customer from '@/models/Customer';
import { StockService } from '../stockService';
import { TreasuryService } from '../treasuryService';

/**
 * Return Service
 * Handles processing of sales returns
 */
export const ReturnService = {
    /**
     * Process a Sales Return
     */
    async processSaleReturn(invoice, returnData, refundMethod, userId) {
        await dbConnect();
        try {
            const { returnItems, totalRefund } = returnData;

            // 1. Update Original Invoice items
            invoice.items = invoice.items.map(invItem => {
                const retItem = returnItems.find(r =>
                    (r.invoiceItemId && r.invoiceItemId.toString() === invItem._id.toString()) ||
                    (r.productId && invItem.productId && r.productId.toString() === invItem.productId.toString())
                );

                if (retItem) {
                    const newQty = invItem.qty - retItem.qty;
                    if (newQty > 0) {
                        return {
                            ...invItem.toObject(),
                            qty: newQty,
                            total: newQty * invItem.unitPrice,
                            profit: newQty * invItem.unitPrice - newQty * (invItem.costPrice || 0)
                        };
                    }
                    return null;
                }
                return invItem;
            }).filter(Boolean);

            const newSubtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
            invoice.total = newSubtotal + (invoice.tax || 0);
            invoice.totalCost = invoice.items.reduce((sum, item) => sum + (item.qty * (item.costPrice || 0)), 0);
            invoice.profit = invoice.total - invoice.totalCost;

            if (invoice.paidAmount > 0) {
                invoice.paidAmount = Math.max(0, invoice.paidAmount - totalRefund);
            }
            invoice.hasReturns = true;
            await invoice.save();

            // 2. Create SalesReturn document
            const salesReturn = await SalesReturn.create([{
                returnNumber: `RET-${Date.now()}`,
                originalInvoice: invoice._id,
                customer: invoice.customer,
                items: returnItems,
                totalRefund,
                refundMethod,
                customerBalanceAdded: refundMethod === 'customerBalance' ? totalRefund : 0,
                treasuryDeducted: refundMethod === 'cash' ? totalRefund : 0,
                createdBy: userId
            }]);

            const salesReturnDoc = salesReturn[0];

            // 3. Stock re-entry
            await StockService.increaseStockForReturn(returnItems, salesReturnDoc.returnNumber, userId);

            // 4. Financial Settlement
            if (refundMethod === 'cash') {
                await TreasuryService.recordReturnRefund(salesReturnDoc, totalRefund, userId);
            } else if (refundMethod === 'customerBalance' && invoice.customer) {
                const customer = await Customer.findById(invoice.customer);
                if (customer) {
                    let remaining = totalRefund;
                    if (customer.balance > 0) {
                        const reduction = Math.min(customer.balance, remaining);
                        customer.balance -= reduction;
                        remaining -= reduction;
                    }
                    if (remaining > 0) {
                        customer.creditBalance = (customer.creditBalance || 0) + remaining;
                    }
                    await customer.save();
                }
            }

            return { salesReturn: salesReturnDoc, invoice };
        } catch (error) {
            throw error;
        }
    }
};
