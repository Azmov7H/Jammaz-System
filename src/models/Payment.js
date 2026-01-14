import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    debtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Debt',
        required: true,
        index: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },

    method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'check', 'cash_wallet', 'internal_transfer'],
        required: true
    },
    referenceNumber: {
        type: String, // e.g. check number, transaction ID
        trim: true
    },

    status: {
        type: String,
        enum: ['completed', 'pending', 'failed', 'reversed'],
        default: 'completed'
    },

    // Audit
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    notes: String,

    // For reversals
    isReversed: {
        type: Boolean,
        default: false
    },
    reusedFor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }
}, {
    timestamps: true
});

// Post-save hook possibilities for updating Debt (usually handled in Service, but good to note)

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
