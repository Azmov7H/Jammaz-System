import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: String,
    notes: String,
    priceType: {
        type: String,
        enum: ['retail', 'wholesale', 'special'],
        default: 'retail'
    },

    // Credit Management
    balance: {
        type: Number,
        default: 0
    },
    creditBalance: {
        type: Number,
        default: 0
    },
    creditLimit: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    financialTrackingEnabled: { type: Boolean, default: true },
    collectionDay: {
        type: String,
        enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'None'],
        default: 'None'
    },
    paymentTerms: { type: Number, default: 0 },

    totalPurchases: { type: Number, default: 0 },
    lastPurchaseDate: Date
}, { timestamps: true });

CustomerSchema.index({ balance: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
