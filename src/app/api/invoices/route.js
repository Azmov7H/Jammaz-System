import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import { StockService } from '@/lib/services/stockService';
import { PricingService } from '@/lib/services/pricingService';
import { AccountingService } from '@/lib/services/accountingService';
import { TreasuryService } from '@/lib/services/treasuryService';
import { DailySalesService } from '@/lib/services/dailySalesService';
import { getCurrentUser } from '@/lib/auth';
import { LogService } from '@/lib/services/logService';

export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const {
            items,
            customerId,
            customerName,
            customerPhone,
            discount = 0,
            tax = 0,
            paymentType = 'cash', // NEW: cash, credit, or bank
            dueDate = null // NEW: for credit invoices
        } = body;

        // 1. Validation
        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 });
        }

        // 2. Customer Handling
        let finalCustomerId = customerId;
        let customer = null;

        if (!finalCustomerId && customerPhone) {
            customer = await Customer.findOne({ phone: customerPhone });
            if (!customer) {
                if (!customerName) {
                    return NextResponse.json({ error: 'اسم العميل مطلوب' }, { status: 400 });
                }
                customer = await Customer.create({
                    name: customerName,
                    phone: customerPhone,
                    priceType: 'retail' // Default
                });
            }
            finalCustomerId = customer._id;
        } else if (finalCustomerId) {
            customer = await Customer.findById(finalCustomerId);
        }

        // 3. Check credit limit if credit sale
        if (paymentType === 'credit' && customer) {
            const invoiceTotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0) + tax - discount;
            if (!customer.canPurchaseOnCredit(invoiceTotal)) {
                return NextResponse.json({
                    error: `تجاوز حد الائتمان. الرصيد الحالي: ${customer.balance}, الحد المسموح: ${customer.creditLimit}`
                }, { status: 400 });
            }
        }

        // 4. Validate Stock Availability FIRST
        const stockValidation = await StockService.validateStockAvailability(items);
        const unavailable = stockValidation.filter(v => !v.available);

        if (unavailable.length > 0) {
            return NextResponse.json({
                error: 'منتجات غير متوفرة بالكمية المطلوبة',
                unavailableItems: unavailable
            }, { status: 400 });
        }

        // 5. Calculate Totals with proper pricing and COGS
        let subtotal = 0;
        let totalCost = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                throw new Error(`المنتج غير موجود: ${item.productId}`);
            }

            // Calculate line totals
            const itemTotal = item.qty * item.unitPrice;
            const lineCost = item.qty * product.buyPrice;
            const lineProfit = itemTotal - lineCost;

            subtotal += itemTotal;
            totalCost += lineCost;

            processedItems.push({
                productId: item.productId,
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: itemTotal,
                costPrice: product.buyPrice, // Snapshot buy price
                profit: lineProfit
            });
        }

        const total = subtotal + tax - discount;
        const totalProfit = total - totalCost;

        // 6. Create Invoice
        const invoice = await Invoice.create({
            number: `INV-${Date.now()}`,
            date: new Date(),
            items: processedItems,
            subtotal,
            tax,
            discount,
            total,
            totalCost,
            profit: totalProfit,
            paymentType,
            paymentStatus: paymentType === 'cash' ? 'paid' : 'pending',
            paidAmount: paymentType === 'cash' ? total : 0,
            dueDate: paymentType === 'credit' && dueDate ? new Date(dueDate) : null,
            customer: finalCustomerId,
            customerName: customerName || (customer ? customer.name : 'عميل'),
            customerPriceType: customer ? customer.priceType : 'retail',
            createdBy: user.userId
        });

        // 7. Execute Business Logic (Stock + Accounting + Treasury + Daily Sales)
        try {
            // Reduce stock from shop
            await StockService.reduceStockForSale(items, invoice._id, user.userId);

            // Create accounting entries
            if (paymentType === 'cash') {
                await AccountingService.createSaleEntries(invoice, user.userId);
                // Record income in treasury for cash sales only
                if (paymentType === 'cash') {
                    await TreasuryService.recordSaleIncome(invoice, user.userId);
                } else if (paymentType === 'bank') {
                    // Bank transactions don't affect physical cashbox
                }
            } else {
                await AccountingService.createCreditSaleEntries(invoice, user.userId);
                // Update customer balance
                if (customer) {
                    customer.balance += total;
                    await customer.save();
                }
            }

            // Update daily sales summary
            await DailySalesService.updateDailySales(invoice, user.userId);

            // Update Customer Stats
            if (finalCustomerId) {
                await Customer.findByIdAndUpdate(finalCustomerId, {
                    $inc: { totalPurchases: total },
                    lastPurchaseDate: new Date()
                });
            }

            // [NEW] Centralized Logging
            await LogService.logAction({
                userId: user.userId,
                action: 'CREATE_INVOICE',
                entity: 'Invoice',
                entityId: invoice._id,
                diff: { total, paymentType, itemsCount: items.length },
                note: `Invoice #${invoice.number} created (${paymentType})`
            });

        } catch (postProcessError) {
            console.error('❌ Post-Invoice Processing Error:', postProcessError);
            // In production, consider voiding the invoice or implementing compensating transactions
            return NextResponse.json({
                warning: 'تم إنشاء الفاتورة ولكن حدث خطأ في تحديث البيانات',
                invoice,
                error: postProcessError.message
            }, { status: 201 });
        }

        return NextResponse.json({
            invoice,
            success: true,
            success: true,
            message: paymentType === 'cash' ? 'تم إنشاء الفاتورة بنجاح' : paymentType === 'bank' ? 'تم إنشاء فاتورة (تحويل بنكي) بنجاح' : 'تم إنشاء فاتورة آجلة بنجاح'
        }, { status: 201 });

    } catch (error) {
        console.error('Invoice Creation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
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
            .limit(limit)
            .lean();

        return NextResponse.json({ invoices });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Error fetching invoices' }, { status: 500 });
    }
}
