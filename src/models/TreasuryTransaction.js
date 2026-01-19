import mongoose from 'mongoose';

const TreasuryTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['INCOME', 'EXPENSE'],
        required: true
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
        enum: ['Invoice', 'PurchaseOrder', 'Manual', 'SalesReturn'],
        default: 'Manual'
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceType'
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
