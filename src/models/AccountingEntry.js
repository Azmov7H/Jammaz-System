import mongoose from 'mongoose';

const AccountingEntrySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    entryNumber: {
        type: String,
        unique: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'SALE',
            'PURCHASE',
            'PAYMENT',
            'ADJUSTMENT',
            'COGS',
            'EXPENSE',
            'INCOME',
            'TRANSFER',
            'RETURN',
            'RETURN_COGS'
        ],
        required: true
    },

    // Double Entry Fields
    debitAccount: {
        type: String,
        required: true,
        index: true
    },
    creditAccount: {
        type: String,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },

    // Description and Reference
    description: {
        type: String,
        required: true
    },
    refType: {
        type: String,
        enum: ['Invoice', 'PurchaseOrder', 'Payment', 'Adjustment', 'PhysicalInventory', 'Manual', 'SalesReturn']
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId
    },

    // Meta
    isSystemGenerated: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String
}, {
    timestamps: true
});

// Auto-generate entry number
AccountingEntrySchema.pre('save', async function () {
    if (this.isNew && !this.entryNumber) {
        // Use the model from 'this.constructor' if possible, or fallback to mongoose.models
        const Model = this.constructor;
        const count = await Model.countDocuments();
        this.entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;
    }
});

// Indexes
AccountingEntrySchema.index({ date: -1 });
AccountingEntrySchema.index({ debitAccount: 1, date: -1 });
AccountingEntrySchema.index({ creditAccount: 1, date: -1 });
AccountingEntrySchema.index({ type: 1 });
AccountingEntrySchema.index({ refType: 1, refId: 1 });

// Static method to create a double entry
AccountingEntrySchema.statics.createEntry = async function ({
    type,
    debitAccount,
    creditAccount,
    amount,
    description,
    refType,
    refId,
    userId,
    notes,
    date
}) {
    return await this.create({
        type,
        debitAccount,
        creditAccount,
        amount,
        description,
        refType,
        refId,
        createdBy: userId,
        notes,
        date: date || new Date()
    });
};

// Force model recompilation in dev to fix cache
if (process.env.NODE_ENV !== 'production' && mongoose.models.AccountingEntry) {
    delete mongoose.models.AccountingEntry;
}

export default mongoose.model('AccountingEntry', AccountingEntrySchema);
