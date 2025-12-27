import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now, index: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        qty: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
        costPrice: { type: Number }, // Buy price at time of sale for profit calculation
        profit: { type: Number } // Profit for this line item
    }],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    usedCreditBalance: { type: Number, default: 0 }, // Amount deducted from customer's credit balance

    // Payment Information
    paymentType: {
        type: String,
        enum: ['cash', 'credit', 'bank'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'partial'],
        default: 'paid'
    },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date }, // For credit invoices

    // Payment History
    payments: [{
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: { type: String, default: 'cash' },
        note: String,
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // Profit Tracking
    totalCost: { type: Number, default: 0 }, // Total COGS
    profit: { type: Number, default: 0 }, // Total profit (total - totalCost - discount)

    // Customer Info
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: String, // Snapshot of name in case customer is deleted or changed
    customerPriceType: { type: String, enum: ['retail', 'wholesale', 'special'] }, // Snapshot

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Performance Indices
InvoiceSchema.index({ customer: 1 });
InvoiceSchema.index({ date: -1 });
InvoiceSchema.index({ paymentType: 1 });
InvoiceSchema.index({ paymentStatus: 1 });

// Pre-save middleware to set payment status based on payment type
InvoiceSchema.pre('save', async function () {
    // For cash invoices, auto-set as paid
    if (this.paymentType === 'cash' && this.isNew) {
        this.paymentStatus = 'paid';
        this.paidAmount = this.total;
    }

    // For credit invoices, default to pending if new
    if (this.paymentType === 'credit' && this.isNew && !this.paymentStatus) {
        this.paymentStatus = 'pending';
        this.paidAmount = 0;
    }

    // Update payment status based on paid amount
    if (!this.isNew && this.paidAmount > 0) {
        if (this.paidAmount >= this.total) {
            this.paymentStatus = 'paid';
        } else if (this.paidAmount > 0) {
            this.paymentStatus = 'partial';
        } else {
            this.paymentStatus = 'pending';
        }
    }

    // Calculate total cost and profit from line items
    if (this.items && this.items.length > 0) {
        this.totalCost = this.items.reduce((sum, item) => {
            return sum + ((item.costPrice || 0) * item.qty);
        }, 0);
        this.profit = this.total - this.totalCost;
    }
});

// Method to record a payment
InvoiceSchema.methods.recordPayment = function (amount, method = 'cash', note = '', userId = null) {
    this.payments.push({
        amount,
        method,
        note,
        recordedBy: userId
    });
    this.paidAmount += amount;
    return this.save();
};

// Virtual for remaining balance
InvoiceSchema.virtual('balance').get(function () {
    return this.total - this.paidAmount;
});

// Virtual for overdue status
InvoiceSchema.virtual('isOverdue').get(function () {
    if (this.paymentStatus === 'paid') return false;
    if (!this.dueDate) return false;
    return new Date() > this.dueDate;
});

// Force model recompilation in dev to fix cache
if (process.env.NODE_ENV !== 'production' && mongoose.models.Invoice) {
    delete mongoose.models.Invoice;
}

export default mongoose.model('Invoice', InvoiceSchema);
