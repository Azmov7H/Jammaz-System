import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import SalesReturn from '@/models/SalesReturn';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import { DailySalesService } from './dailySalesService';
import { LogService } from './logService';
import { TreasuryService } from './treasuryService';
import { StockService } from './stockService';
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
        // Standalone Compatibility: Transactions Removed
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            // 1. Stock reduction
            await StockService.reduceStockForSale(invoice.items, invoice._id, userId);

            // 2. Treasury & Customer Balance (Moved up)
            // Note: We only record cash received in Treasury. Credit sales don't hit Treasury until paid.

            // 3. Treasury & Customer Balance
            const netCashReceived = invoice.paidAmount - (invoice.usedCreditBalance || 0);

            if (netCashReceived > 0) {
                await TreasuryService.recordSaleIncome({
                    ...invoice.toObject(),
                    total: netCashReceived,
                    number: invoice.usedCreditBalance > 0 ? `${invoice.number} (بعد الخصم)` : invoice.number
                }, userId);
            }

            // 4. Update Customer Balance (Legacy Simple Debt) AND Create Granular Debt Record
            if (invoice.customer && (invoice.paymentType === 'credit' || invoice.paymentType === 'partial')) {
                const customer = await Customer.findById(invoice.customer);
                if (customer) {
                    const remainingDebt = invoice.total - invoice.paidAmount;
                    if (remainingDebt > 0) {
                        // Update Legacy Balance
                        customer.balance = (customer.balance || 0) + remainingDebt;
                        await customer.save();

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
                        });
                    }
                }
            }

            // 5. Daily Sales & Stats
            await DailySalesService.updateDailySales(invoice, userId);

            if (invoice.customer) {
                await Customer.findByIdAndUpdate(invoice.customer, {
                    $inc: {
                        totalPurchases: invoice.total
                    },
                    lastPurchaseDate: new Date()
                });
            }

            // 6. Logging
            await LogService.logAction({
                userId,
                action: 'CREATE_INVOICE',
                entity: 'Invoice',
                entityId: invoice._id,
                diff: { total: invoice.total, paymentType: invoice.paymentType },
                note: `Invoice #${invoice.number} processed by FinanceService`
            });

            // await session.commitTransaction();
            return invoice;
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        } finally {
            // session.endSession();
        }
    },

    /**
     * Reverse a Sale (Delete Invoice Logic)
     */
    async reverseSale(invoiceId, userId) {
        await dbConnect();
        // Standalone Compatibility: Transactions Removed
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            const invoice = await Invoice.findById(invoiceId).populate('items.productId');
            if (!invoice) throw new Error('الفاتورة غير موجودة');

            // 1. Reverse Stock
            for (const item of invoice.items) {
                if (item.isService || !item.productId) continue;

                const product = await Product.findById(item.productId);
                if (product) {
                    product.shopQty += item.qty;
                    product.stockQty = (product.warehouseQty || 0) + product.shopQty;
                    await product.save();

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
                    }]);
                }
            }

            // 2. Reverse Treasury Transactions
            // Find and delete any treasury transactions linked to this invoice
            await TreasuryService.deleteTransactionByRef('Invoice', invoice._id);

            // 3. Update Customer Balance & Debt
            if (invoice.customer) {
                const customer = await Customer.findById(invoice.customer);
                if (customer) {
                    // Update Legacy Balance
                    const remainingDebt = invoice.total - invoice.paidAmount;
                    if (remainingDebt > 0) {
                        customer.balance = Math.max(0, (customer.balance || 0) - remainingDebt);
                        await customer.save();
                    }

                    // Delete Debt Record
                    const Debt = (await import('@/models/Debt')).default;
                    const debt = await Debt.findOne({ referenceType: 'Invoice', referenceId: invoice._id });
                    if (debt) {
                        // Delete Schedules
                        const PaymentSchedule = (await import('@/models/PaymentSchedule')).default;
                        await PaymentSchedule.deleteMany({ debtId: debt._id });
                        await debt.deleteOne();
                    }
                }
            }

            // 4. Delete Invoice
            await invoice.deleteOne();

            // 5. Logging
            await LogService.logAction({
                userId,
                action: 'REVERSE_INVOICE',
                entity: 'Invoice',
                entityId: invoice._id,
                note: `Invoice #${invoice.number} cancelled and reversed`
            });

            // await session.commitTransaction();
            return { success: true };
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        } finally {
            // session.endSession();
        }
    },

    /**
     * Record a Purchase (Receiving PO)
     */
    async recordPurchaseReceive(po, userId, paymentType = 'cash') {
        await dbConnect();
        // Standalone Compatibility: Transactions Removed
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            // 1. Stock increase
            await StockService.increaseStockForPurchase(po.items, po._id, userId);

            // 2. Update PO status
            po.status = 'RECEIVED';
            po.receivedDate = new Date();
            po.paymentType = paymentType;
            await po.save();

            // 3. Treasury & Supplier Balance
            // Note: Only Cash/Wallet Payments are recorded in Treasury immediately.
            if (paymentType === 'cash' || paymentType === 'wallet') {
                po.paidAmount = po.totalCost;
                po.paymentStatus = 'paid';
                await po.save();

                // For wallet, we might want to note it in description (handled in TreasuryService or passed here)
                // For now, treating both as immediate expense
                await TreasuryService.recordPurchaseExpense(po, userId);
            } else if ((paymentType === 'credit' || paymentType === 'bank') && po.supplier) {
                // Note: Bank transfer usually means money left account, but maybe not 'Cashbox'. 
                // However, user grouped Bank/Credit vs Cash/Wallet often implies:
                // Cash/Wallet = Immediate Cashbox/Wallet deduction
                // Credit = Debt
                // Bank = Immediate Bank deduction (not Cashbox)

                // ADJUSTMENT: Use 'bank' check carefully. 
                // If 'bank', it is PAID but maybe not from Cashbox? 
                // User asked for "Bank Transfer, Deferred, Cash, Cash Wallet".
                // Usually Bank Transfer is Paid.

                if (paymentType === 'bank') {
                    po.paidAmount = po.totalCost;
                    po.paymentStatus = 'paid';
                    await po.save();
                    // TODO: access BankTransactionService if exists, else just mark paid avoiding Cashbox
                    // If no BankService, we might record as expense but type 'BANK'
                } else {
                    // Credit
                    po.paidAmount = 0;
                    po.paymentStatus = 'pending';
                    await po.save();
                }

                if (paymentType === 'credit') {
                    const supplier = await Supplier.findById(po.supplier);
                    if (supplier) {
                        // Legacy Update
                        supplier.balance = (supplier.balance || 0) + po.totalCost;
                        supplier.lastSupplyDate = new Date();
                        await supplier.save();

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
                        });
                    }
                }
            }

            // await session.commitTransaction();
            return po;
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        } finally {
            // session.endSession();
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
        // [MOD] Transaction Removed for Standalone Compatibility
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            await invoice.recordPayment(amount, method, note, userId); // session);

            if (invoice.customer) {
                const customer = await Customer.findById(invoice.customer); // .session(session);
                if (customer) {
                    customer.balance = Math.max(0, (customer.balance || 0) - amount);
                    await customer.save(); // { session });

                    // Update Schedules
                    await this.updateSchedulesAfterPayment(invoice.customer, 'Customer', amount); // session);

                    // Update Granular Debt Record
                    const Debt = (await import('@/models/Debt')).default;
                    const debt = await Debt.findOne({ referenceType: 'Invoice', referenceId: invoice._id });
                    if (debt) {
                        await DebtService.updateBalance(debt._id, amount);
                    }
                }
            }

            const tx = await TreasuryService.recordPaymentCollection(invoice, amount, userId, method, note);

            // await session.commitTransaction();
            return { invoice, transaction: tx };
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        } finally {
            // session.endSession();
        }
    },

    /**
     * Record a Supplier Payment (Paying debts)
     */
    async recordSupplierPayment(po, amount, method, note, userId) {
        await dbConnect();
        // [MOD] Transaction Removed for Standalone Compatibility
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            // Update PO payment status
            po.paidAmount = (po.paidAmount || 0) + amount;
            if (po.paidAmount >= po.totalCost) {
                po.paymentStatus = 'paid';
                po.paidAmount = po.totalCost;
            } else {
                po.paymentStatus = 'partial';
            }
            await po.save(); // { session });

            // Update Supplier Balance
            if (po.supplier) {
                const supplier = await Supplier.findById(po.supplier); // .session(session);
                if (supplier) {
                    supplier.balance = Math.max(0, (supplier.balance || 0) - amount);
                    await supplier.save(); // { session });

                    // Update Schedules
                    await this.updateSchedulesAfterPayment(po.supplier, 'Supplier', amount); // session);

                    // Update Granular Debt Record
                    const Debt = (await import('@/models/Debt')).default;
                    const debt = await Debt.findOne({ referenceType: 'PurchaseOrder', referenceId: po._id });
                    if (debt) {
                        await DebtService.updateBalance(debt._id, amount);
                    }
                }
            }

            // Record in Treasury & Accounting
            await TreasuryService.recordSupplierPayment(
                po.supplier,
                amount,
                po.poNumber,
                po._id,
                userId,
                method,
                note
            );

            // await session.commitTransaction();
            return po;
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        } finally {
            // session.endSession();
        }
    },

    /**
     * Process a Sales Return
     * orchestrates: Invoice update, Return record, Stock re-entry, Accounting reversal, Financial settlement.
     */
    async processSaleReturn(invoice, returnData, refundMethod, userId) {
        await dbConnect();
        // [MOD] Transaction Removed for Standalone Compatibility
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            const { returnItems, totalRefund, totalCostImpact } = returnData;

            // 1. Update Original Invoice
            invoice.items = invoice.items.map(invItem => {
                // Better matching using invoiceItemId if provided, else fallback to productId
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

            // Paid amount reduction (if cash was paid)
            if (invoice.paidAmount > 0) {
                invoice.paidAmount = Math.max(0, invoice.paidAmount - totalRefund);
            }
            invoice.hasReturns = true;
            await invoice.save(); // { session });

            // 2. Create SalesReturn document
            const salesReturn = await SalesReturn.create([{
                returnNumber: `RET-${Date.now()}`,
                originalInvoice: invoice._id,
                customer: invoice.customer, // Added customer here
                items: returnItems,
                totalRefund,
                refundMethod,
                customerBalanceAdded: refundMethod === 'customerBalance' ? totalRefund : 0,
                treasuryDeducted: refundMethod === 'cash' ? totalRefund : 0,
                createdBy: userId
            }]); // , { session });

            const salesReturnDoc = salesReturn[0];

            // 3. Stock re-entry
            await StockService.increaseStockForReturn(returnItems, salesReturnDoc.returnNumber, userId); // session);

            // 4. Financial Settlement (Moved up logic implies we just handle money)

            // 5. Financial Settlement
            if (refundMethod === 'cash') {
                await TreasuryService.recordReturnRefund(
                    salesReturnDoc,
                    totalRefund,
                    userId
                ); // session);
            } else if (refundMethod === 'customerBalance' && invoice.customer) {
                const customer = await Customer.findById(invoice.customer); // .session(session);
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
                    await customer.save(); // { session });
                }
            }

            // await session.commitTransaction();
            return { salesReturn: salesReturnDoc, invoice };
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        } finally {
            // session.endSession();
        }
    },

    /**
     * Record a General Expense
     */
    async recordExpense(data, userId) {
        await dbConnect();
        // [MOD] Transaction Removed for Standalone Compatibility
        // const session = await mongoose.startSession();
        // session.startTransaction();

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
                userId
            ); // session

            // 2. Log is below

            // 3. Optional: Log the expense
            await LogService.logAction({
                userId,
                action: 'CREATE_EXPENSE',
                entity: 'Treasury',
                entityId: treasuryRecord._id,
                diff: { amount, category, reason },
                note: `General expense recorded: ${reason}`
            }); // session

            // await session.commitTransaction();
            return { treasuryRecord };
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        } finally {
            // session.endSession();
        }
    },

    /**
     * Record payment for Manual Debt (Opening Balance / Migrated)
     */
    async recordManualDebtPayment(debt, amount, method, note, userId) {
        await dbConnect();

        // 1. Update Legacy Balance (Debtor)
        if (debt.debtorType === 'Customer') {
            const customer = await Customer.findById(debt.debtorId);
            if (customer) {
                customer.balance = Math.max(0, (customer.balance || 0) - amount);
                await customer.save();
                await this.updateSchedulesAfterPayment(customer._id, 'Customer', amount);
            }
        } else if (debt.debtorType === 'Supplier') {
            const { default: Supplier } = await import('@/models/Supplier');
            const supplier = await Supplier.findById(debt.debtorId);
            if (supplier) {
                supplier.balance = Math.max(0, (supplier.balance || 0) - amount);
                await supplier.save();
                await this.updateSchedulesAfterPayment(supplier._id, 'Supplier', amount);
            }
        }

        // 2. Update Debt Record
        await DebtService.updateBalance(debt._id, amount);

        // Record in Treasury
        const tx = await TreasuryService.recordDebtTransaction(
            debt._id,
            debt.debtorId,
            amount,
            debt.debtorType === 'Customer' ? 'INCOME' : 'EXPENSE',
            userId,
            debt.debtorType === 'Customer'
                ? `تحصيل مديونية سابقة: ${debt.description || ''} ${note ? `- ${note}` : ''}`
                : `سداد مديونية سابقة للمورد: ${note ? `- ${note}` : ''}`,
            method
        );

        return { debt, transaction: tx };
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

            if (invoice) {
                return await this.recordCustomerPayment(invoice, amount, method, note, userId);
            } else {
                // Handle Manual Customer Debt (Opening Balance or Migrated)
                const { default: Debt } = await import('@/models/Debt');
                let debt = await Debt.findById(id);
                if (!debt) debt = await Debt.findOne({ referenceId: id, debtorType: 'Customer' });

                if (debt) {
                    return await this.recordManualDebtPayment(debt, amount, method, note, userId);
                } else {
                    throw 'الفاتورة أو المديونية غير موجودة';
                }
            }
        } else if (type === 'payable') {
            const { default: PurchaseOrder } = await import('@/models/PurchaseOrder');
            const po = await PurchaseOrder.findById(id).populate('supplier');

            if (po) {
                return await this.recordSupplierPayment(po, amount, method, note, userId);
            } else {
                // Handle Manual Supplier Debt (Opening Balance)
                const { default: Debt } = await import('@/models/Debt');
                let debt = await Debt.findById(id);
                if (!debt) debt = await Debt.findOne({ referenceId: id, debtorType: 'Supplier' });

                if (debt) {
                    return await this.recordManualDebtPayment(debt, amount, method, note, userId);
                } else {
                    throw 'أمر الشراء أو المديونية غير موجودة';
                }
            }
        }

        throw 'نوع عملية غير معروف';
    }
};
