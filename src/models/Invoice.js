import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now, index: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        qty: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: String, // Snapshot of name in case customer is deleted or changed
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Performance Indices
InvoiceSchema.index({ customer: 1 });
InvoiceSchema.index({ date: -1 });
InvoiceSchema.index({ number: 1 });

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
