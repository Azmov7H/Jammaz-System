import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';
import { AccountingService } from '@/lib/services/accountingService';
import { TreasuryService } from '@/lib/services/treasuryService';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { invoiceId, amount, method = 'cash', note = '' } = body;

        // Validation
        if (!invoiceId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
        }

        // Get invoice
        const invoice = await Invoice.findById(invoiceId).populate('customer');
        if (!invoice) {
            return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        // Check if already paid
        if (invoice.paymentStatus === 'paid') {
            return NextResponse.json({ error: 'الفاتورة مدفوعة بالكامل' }, { status: 400 });
        }

        // Calculate remaining balance
        const remainingBalance = invoice.total - invoice.paidAmount;

        // Validate payment amount
        if (amount > remainingBalance) {
            return NextResponse.json({
                error: `المبلغ أكبر من المتبقي. المتبقي: ${remainingBalance}`
            }, { status: 400 });
        }

        // 5. Execute Business Logic via centralized FinanceService
        try {
            const { FinanceService } = await import('@/lib/services/financeService');
            await FinanceService.recordCustomerPayment(invoice, amount, method, note, user.userId);
        } catch (procErr) {
            console.error('❌ Post-Payment Processing Error:', procErr);
            return NextResponse.json({ error: 'حدث خطأ أثناء تحديث البيانات المالية' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            invoice,
            message: 'تم تسجيل الدفعة بنجاح',
            remainingBalance: invoice.total - invoice.paidAmount
        });

    } catch (error) {
        console.error('Payment Recording Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // pending, partial
        const customerId = searchParams.get('customerId');

        const query = { paymentType: 'credit' };

        if (status) {
            query.paymentStatus = status;
        } else {
            // Default: show unpaid and partial
            query.paymentStatus = { $in: ['pending', 'partial'] };
        }

        if (customerId) {
            query.customer = customerId;
        }

        const invoices = await Invoice.find(query)
            .populate('customer', 'name phone balance')
            .populate('createdBy', 'name')
            .sort({ date: -1 })
            .lean();

        // Calculate total receivables
        const totalReceivables = invoices.reduce((sum, inv) => {
            return sum + (inv.total - inv.paidAmount);
        }, 0);

        return NextResponse.json({
            invoices,
            totalReceivables,
            count: invoices.length
        });

    } catch (error) {
        console.error('Error fetching unpaid invoices:', error);
        return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
    }
}
