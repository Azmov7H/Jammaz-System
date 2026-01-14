import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import SalesReturn from '@/models/SalesReturn';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import { StockService } from './stockService';
import { AccountingService } from './accountingService';
import { TreasuryService } from './treasuryService';
import { DailySalesService } from './dailySalesService';
import { LogService } from './logService';
import { DebtService } from './financial/debtService';
import InvoiceSettings from '@/models/InvoiceSettings';

/**
 * Finance Service
 * The orchestrator for all financial and stock operations.
 */
export const FinanceService = {
    /**
     * Record a Sale (Invoice)
     */
    async recordSale(invoice, userId) {
        await dbConnect();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Stock reduction
            await StockService.reduceStockForSale(invoice.items, invoice._id, userId, session);

            // 2. Accounting Entries
            if (invoice.paymentType === 'credit') {
                await AccountingService.createCreditSaleEntries(invoice, userId, session);
            } else {
                await AccountingService.createSaleEntries(invoice, userId, session);
            }

            // 3. Treasury & Customer Balance
            const netCashReceived = invoice.paidAmount - (invoice.usedCreditBalance || 0);

            if (netCashReceived > 0) {
                await TreasuryService.recordSaleIncome({
                    ...invoice.toObject(),
                    total: netCashReceived,
                    number: invoice.usedCreditBalance > 0 ? `${invoice.number} (بعد الخصم)` : invoice.number
                }, userId, session);
            }

            // 4. Update Customer Balance (Legacy Simple Debt) AND Create Granular Debt Record
            if (invoice.customer && (invoice.paymentType === 'credit' || invoice.paymentType === 'partial')) {
                const customer = await Customer.findById(invoice.customer).session(session);
                if (customer) {
                    const remainingDebt = invoice.total - invoice.paidAmount;
                    if (remainingDebt > 0) {
                        // Update Legacy Balance
                        customer.balance = (customer.balance || 0) + remainingDebt;
                        await customer.save({ session });

                        // Get Default Terms from Settings
                        const settings = await InvoiceSettings.getSettings();
                        const defaultDays = settings.defaultCustomerTerms || 15;

                        // Create New Debt Record
                        await DebtService.createDebt({
                            debtorType: 'Customer',
                            debtorId: customer._id,
                            amount: remainingDebt,
                            dueDate: invoice.dueDate || new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000),
                            referenceType: 'Invoice',
                            referenceId: invoice._id,
                            description: `فاتورة مبيعات #${invoice.number}`,
                            createdBy: userId
                        }, session);
                    }
                }
            }

            // 5. Daily Sales & Stats
            await DailySalesService.updateDailySales(invoice, userId, session);

            if (invoice.customer) {
                await Customer.findByIdAndUpdate(invoice.customer, {
                    $inc: {
                        totalPurchases: invoice.total
                    },
                    lastPurchaseDate: new Date()
                }, { session });
            }

            // 6. Logging
            await LogService.logAction({
                userId,
                action: 'CREATE_INVOICE',
                entity: 'Invoice',
                entityId: invoice._id,
                diff: { total: invoice.total, paymentType: invoice.paymentType },
                note: `Invoice #${invoice.number} processed by FinanceService`
            }, session);

            await session.commitTransaction();
            return invoice;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Reverse a Sale (Delete Invoice Logic)
     */
    async reverseSale(invoiceId, userId) {
        await dbConnect();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const invoice = await Invoice.findById(invoiceId).populate('items.productId').session(session);
            if (!invoice) throw new Error('الفاتورة غير موجودة');

            // 1. Reverse Stock
            for (const item of invoice.items) {
                const product = await Product.findById(item.productId).session(session);
                if (product) {
                    product.shopQty += item.qty;
                    product.stockQty = (product.warehouseQty || 0) + product.shopQty;
                    await product.save({ session });

                    // Log movement
                    const StockMovement = (await import('@/models/StockMovement')).default;
                    await StockMovement.create([{
                        productId: product._id,
                        type: 'IN',
                        qty: item.qty,
                        note: `إلغاء فاتورة #${invoice.number}`,
                        refId: invoice._id,
                        createdBy: userId,
                        snapshot: {
                            warehouseQty: product.warehouseQty,
                            shopQty: product.shopQty
                        }
                    }], { session });
                }
            }

            // 2. Reverse Accounting Entries
            const AccountingEntry = (await import('@/models/AccountingEntry')).default;
            const originalEntries = await AccountingEntry.find({ refType: 'Invoice', refId: invoice._id }).session(session);

            for (const entry of originalEntries) {
                await AccountingEntry.createEntry({
                    type: 'ADJUSTMENT',
                    debitAccount: entry.creditAccount,
                    creditAccount: entry.debitAccount,
                    amount: entry.amount,
                    description: `إلغاء قيد: ${entry.description}`,
                    refType: 'Invoice',
                    refId: invoice._id,
                    userId,
                    date: new Date(),
                    session
                });
            }

            // 3. Update Customer Balance & Debt
            if (invoice.customer) {
                const customer = await Customer.findById(invoice.customer).session(session);
                if (customer) {
                    // Update Legacy Balance
                    const remainingDebt = invoice.total - invoice.paidAmount;
                    if (remainingDebt > 0) {
                        customer.balance = Math.max(0, (customer.balance || 0) - remainingDebt);
                        await customer.save({ session });
                    }

                    // Delete Debt Record
                    const Debt = (await import('@/models/Debt')).default;
                    const debt = await Debt.findOne({ referenceType: 'Invoice', referenceId: invoice._id }).session(session);
                    if (debt) {
                        // Delete Schedules
                        const PaymentSchedule = (await import('@/models/PaymentSchedule')).default;
                        await PaymentSchedule.deleteMany({ debtId: debt._id }).session(session);
                        await debt.deleteOne({ session });
                    }
                }
            }

            // 4. Delete Invoice
            await invoice.deleteOne({ session });

            // 5. Logging
            await LogService.logAction({
                userId,
                action: 'REVERSE_INVOICE',
                entity: 'Invoice',
                entityId: invoice._id,
                note: `Invoice #${invoice.number} cancelled and reversed`
            }, session);

            await session.commitTransaction();
            return { success: true };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Record a Purchase (Receiving PO)
     */
    async recordPurchaseReceive(po, userId, paymentType = 'cash') {
        await dbConnect();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Stock increase
            await StockService.increaseStockForPurchase(po.items, po._id, userId, session);

            // 2. Update PO status
            po.status = 'RECEIVED';
            po.receivedDate = new Date();
            po.paymentType = paymentType;
            await po.save({ session });

            // 3. Accounting Entries
            await AccountingService.createPurchaseEntries(po, userId, paymentType, session);

            // 4. Treasury & Supplier Balance
            if (paymentType === 'cash') {
                po.paidAmount = po.totalCost;
                po.paymentStatus = 'paid';
                await po.save({ session });
                await TreasuryService.recordPurchaseExpense(po, userId, session);
            } else if (paymentType === 'credit' && po.supplier) {
                po.paidAmount = 0;
                po.paymentStatus = 'pending';
                await po.save({ session });
                const supplier = await Supplier.findById(po.supplier).session(session);
                if (supplier) {
                    // Legacy Update
                    supplier.balance = (supplier.balance || 0) + po.totalCost;
                    supplier.lastSupplyDate = new Date();
                    await supplier.save({ session });

                    // Get Default Terms from Settings
                    const settings = await InvoiceSettings.getSettings();
                    const defaultDays = settings.defaultSupplierTerms || 30;

                    // New Debt Record
                    await DebtService.createDebt({
                        debtorType: 'Supplier',
                        debtorId: supplier._id,
                        amount: po.totalCost,
                        dueDate: po.expectedDate || new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000),
                        referenceType: 'PurchaseOrder',
                        referenceId: po._id,
                        description: `أمر شراء #${po.poNumber}`,
                        createdBy: userId
                    }, session);
                }
            }

            await session.commitTransaction();
            return po;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Helper: Update schedules after a payment
     */
    async updateSchedulesAfterPayment(entityId, entityType, amount, session = null) {
        const PaymentSchedule = require('@/models/PaymentSchedule').default;

        // Find pending or overdue schedules sorted by due date
        const schedules = await PaymentSchedule.find({
            entityId,
            entityType,
            status: { $in: ['PENDING', 'OVERDUE'] }
        }).sort({ dueDate: 1 }).session(session);

        let remaining = amount;

        for (const schedule of schedules) {
            if (remaining <= 0) break;

            if (remaining >= schedule.amount) {
                // Payment covers this installment or more
                remaining -= schedule.amount;
                schedule.amount = 0;
                schedule.status = 'PAID';
                schedule.paidAt = new Date();
                await schedule.save({ session });
            } else {
                // Payment is a partial for this installment
                schedule.amount -= remaining;
                remaining = 0;
                // Keep status as PENDING or OVERDUE, but with reduced amount
                await schedule.save({ session });
            }
        }
    },

    /**
     * Record a Payment Collection
     */
    async recordCustomerPayment(invoice, amount, method, note, userId) {
        await dbConnect();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await invoice.recordPayment(amount, method, note, userId, session);

            if (invoice.customer) {
                const customer = await Customer.findById(invoice.customer).session(session);
                if (customer) {
                    customer.balance = Math.max(0, (customer.balance || 0) - amount);
                    await customer.save({ session });

                    // Update Schedules
                    await this.updateSchedulesAfterPayment(invoice.customer, 'Customer', amount, session);
                }
            }

            await AccountingService.createPaymentEntries(invoice, amount, userId, new Date(), session);
            await TreasuryService.recordPaymentCollection({
                ...invoice.toObject(),
                paidAmount: amount,
                paymentMethod: method
            }, userId, session);

            await session.commitTransaction();
            return invoice;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Record a Supplier Payment (Paying debts)
     */
    async recordSupplierPayment(po, amount, method, note, userId) {
        await dbConnect();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update PO payment status
            po.paidAmount = (po.paidAmount || 0) + amount;
            if (po.paidAmount >= po.totalCost) {
                po.paymentStatus = 'paid';
                po.paidAmount = po.totalCost;
            } else {
                po.paymentStatus = 'partial';
            }
            await po.save({ session });

            // Update Supplier Balance
            if (po.supplier) {
                const supplier = await Supplier.findById(po.supplier).session(session);
                if (supplier) {
                    supplier.balance = Math.max(0, (supplier.balance || 0) - amount);
                    await supplier.save({ session });

                    // Update Schedules
                    await this.updateSchedulesAfterPayment(po.supplier, 'Supplier', amount, session);
                }
            }

            // Record in Treasury & Accounting
            await TreasuryService.recordPurchaseExpense({
                ...po.toObject(),
                totalCost: amount, // Record only this payment amount
                notes: `سداد جزء من أمر شراء #${po.poNumber}. ${note}`
            }, userId, session);

            await AccountingService.createSupplierPaymentEntries(po, amount, userId, new Date(), session);

            await session.commitTransaction();
            return po;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Process a Sales Return
     * orchestrates: Invoice update, Return record, Stock re-entry, Accounting reversal, Financial settlement.
     */
    async processSaleReturn(invoice, returnData, refundMethod, userId) {
        await dbConnect();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { returnItems, totalRefund, totalCostImpact } = returnData;

            // 1. Update Original Invoice
            // We modify the items and totals. If an item qty becomes 0, we keep it with 0 or remove. 
            // Consistent with legacy logic: map and filter.
            invoice.items = invoice.items.map(invItem => {
                const retItem = returnItems.find(r => r.productId.toString() === invItem.productId.toString());
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

            // Paid amount reduction (if cash was paid)
            if (invoice.paidAmount > 0) {
                invoice.paidAmount = Math.max(0, invoice.paidAmount - totalRefund);
            }
            await invoice.save({ session });

            // 2. Create SalesReturn document
            const salesReturn = await SalesReturn.create([{
                returnNumber: `RET-${Date.now()}`,
                originalInvoice: invoice._id,
                items: returnItems,
                totalRefund,
                refundMethod,
                customerBalanceAdded: refundMethod === 'customerBalance' ? totalRefund : 0,
                treasuryDeducted: refundMethod === 'cash' ? totalRefund : 0,
                createdBy: userId
            }], { session }); // create returns array

            const salesReturnDoc = salesReturn[0];

            // 3. Stock re-entry
            await StockService.increaseStockForReturn(returnItems, salesReturnDoc.returnNumber, userId, session);

            // 4. Accounting reversal
            await AccountingService.createReturnEntries(salesReturnDoc, totalCostImpact, userId, session);

            // 5. Financial Settlement
            if (refundMethod === 'cash') {
                await TreasuryService.addManualExpense(
                    new Date(),
                    totalRefund,
                    `استرداد نقدي - فاتورة ${invoice.number}`,
                    'other',
                    userId,
                    session
                );
            } else if (refundMethod === 'customerBalance' && invoice.customer) {
                const customer = await Customer.findById(invoice.customer).session(session);
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
                    await customer.save({ session });
                }
            }

            await session.commitTransaction();
            return { salesReturn: salesReturnDoc, invoice };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Record a General Expense
     */
    async recordExpense(data, userId) {
        await dbConnect();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { amount, reason, category, date = new Date() } = data;

            if (!amount || amount <= 0 || !reason || !category) {
                throw 'بيانات المصروفات غير مكتملة';
            }

            // 1. Record in Treasury
            const treasuryRecord = await TreasuryService.addManualExpense(
                date,
                parseFloat(amount),
                reason,
                category,
                userId,
                session
            );

            // 2. Record in Accounting
            const accountingEntry = await AccountingService.createExpenseEntry(
                parseFloat(amount),
                category,
                reason,
                userId,
                date,
                session
            );

            // 3. Optional: Log the expense
            await LogService.logAction({
                userId,
                action: 'CREATE_EXPENSE',
                entity: 'Treasury',
                entityId: treasuryRecord._id,
                diff: { amount, category, reason },
                note: `General expense recorded: ${reason}`
            }, session);

            await session.commitTransaction();
            return { treasuryRecord, accountingEntry };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    /**
     * Consistently settle debts (receivables or payables)
     */
    async settleDebt(data, userId) {
        await dbConnect();
        const { type, id, amount, method = 'cash', note = '' } = data;

        if (!type || !id || !amount || amount <= 0) {
            throw 'بيانات غير صحيحة لسداد الدين';
        }

        if (type === 'receivable') {
            const invoice = await Invoice.findById(id).populate('customer');
            if (!invoice) throw 'الفاتورة غير موجودة';

            await this.recordCustomerPayment(invoice, amount, method, note, userId);
            return { message: 'تم تحصيل الدفعة بنجاح' };

        } else if (type === 'payable') {
            const PurchaseOrder = (await import('@/models/PurchaseOrder')).default;
            const po = await PurchaseOrder.findById(id).populate('supplier');
            if (!po) throw 'أمر الشراء غير موجود';

            await this.recordSupplierPayment(po, amount, method, note, userId);
            return { message: 'تم سداد الدفعة للمورد بنجاح' };
        }

        throw 'نوع عملية غير معروف';
    }
};
