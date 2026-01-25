import mongoose from 'mongoose';

const TreasuryTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['INCOME', 'EXPENSE'],
        required: true
    },
    receiptNumber: {
        type: String,
        unique: false, // We'll handle uniqueness in service/app logic for simplicity with legacy data
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    referenceType: {
        type: String,
        enum: ['Invoice', 'PurchaseOrder', 'Manual', 'SalesReturn', 'Debt'],
        default: 'Manual'
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceType'
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // Optional for manual generic entries
        index: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.models.TreasuryTransaction || mongoose.model('TreasuryTransaction', TreasuryTransactionSchema);
