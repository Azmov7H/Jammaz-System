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
import InvoiceSettings from '@/models/InvoiceSettings';

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
            tax = 0,
            paymentType = 'cash', // cash, credit, or bank
        } = body;

        let { dueDate = null } = body;

        // Auto-set Due Date for credit invoices if missing
        if (paymentType === 'credit' && !dueDate) {
            let terms = 0;

            // Check for customer-specific terms
            if (customerId) {
                const customer = await Customer.findById(customerId);
                if (customer && customer.paymentTerms > 0) {
                    terms = customer.paymentTerms;
                }
            }

            // Fallback to global settings if no customer terms
            if (terms === 0) {
                const settings = await InvoiceSettings.getSettings();
                terms = settings.defaultCustomerTerms || 15;
            }

            const date = new Date();
            date.setDate(date.getDate() + terms);
            dueDate = date;
        }

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
            const invoiceTotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0) + tax;

            // Explicit check for unlimited credit (0)
            const limit = Number(customer.creditLimit) || 0;
            const currentBalance = Number(customer.balance) || 0;
            const isUnlimited = limit === 0;

            if (!isUnlimited && (currentBalance + invoiceTotal) > limit) {
                return NextResponse.json({
                    error: `تجاوز حد الائتمان. الرصيد الحالي: ${currentBalance}, الحد المسموح: ${limit}`
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

        const total = subtotal + tax;
        const totalProfit = total - totalCost;

        // [NEW] Handle Customer Credit Balance (from returns)
        let appliedCredit = 0;
        if (customer && customer.creditBalance > 0) {
            appliedCredit = Math.min(total, customer.creditBalance);
            customer.creditBalance -= appliedCredit;
            await customer.save();
        }

        // 6. Create Invoice
        const invoice = await Invoice.create({
            number: `INV-${Date.now()}`,
            date: new Date(),
            items: processedItems,
            subtotal,
            tax,
            total,
            usedCreditBalance: appliedCredit,
            totalCost,
            profit: totalProfit,
            paymentType,
            paymentStatus: (paymentType === 'cash' && (appliedCredit >= total)) ? 'paid' : (paymentType === 'cash' ? 'partial' : 'pending'),
            paidAmount: paymentType === 'cash' ? total : appliedCredit, // If cash, we assume they pay the rest. If credit, only the applied credit is 'paid'
            dueDate: paymentType === 'credit' && dueDate ? new Date(dueDate) : null,
            customer: finalCustomerId,
            customerName: customerName || (customer ? customer.name : 'عميل'),
            customerPriceType: customer ? customer.priceType : 'retail',
            createdBy: user.userId
        });

        // 7. Execute Business Logic via centralized FinanceService
        try {
            const { FinanceService } = await import('@/lib/services/financeService');
            await FinanceService.recordSale(invoice, user.userId);
        } catch (postProcessError) {
            console.error('❌ Post-Invoice Processing Error:', postProcessError);
            return NextResponse.json({
                warning: 'تم إنشاء الفاتورة ولكن حدث خطأ في تحديث البيانات المالية',
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
