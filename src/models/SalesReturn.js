import mongoose from 'mongoose';

const SalesReturnSchema = new mongoose.Schema({
    returnNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },

    // Original Invoice Reference
    originalInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },

    // Returned Items
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        qty: { type: Number, required: true }, // Quantity returned
        unitPrice: { type: Number, required: true }, // Price from original invoice
        refundAmount: { type: Number, required: true }, // qty * unitPrice
        reason: String
    }],

    // Financials
    totalRefund: { type: Number, required: true },

    // Refund Method
    refundMethod: {
        type: String,
        enum: ['cash', 'customerBalance'],
        required: true,
        default: 'cash'
    },

    // Tracking
    customerBalanceAdded: {
        type: Number,
        default: 0
    },
    treasuryDeducted: {
        type: Number,
        default: 0
    },

    // Legacy field - kept for backward compatibility
    type: {
        type: String,
        enum: ['cash', 'credit'],
        required: false
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.SalesReturn || mongoose.model('SalesReturn', SalesReturnSchema);
