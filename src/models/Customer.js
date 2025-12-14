import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, unique: true, required: true },
    email: String,
    address: String,

    // Pricing Tier
    priceType: {
        type: String,
        enum: ['retail', 'wholesale', 'special'],
        default: 'retail'
    },

    // Credit Management
    balance: { type: Number, default: 0 }, // Running balance for credit sales
    creditLimit: { type: Number, default: 0 }, // Maximum credit allowed

    // Custom Product Pricing
    customPricing: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        customPrice: { type: Number, required: true },
        setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        setAt: { type: Date, default: Date.now }
    }],

    // Stats
    totalPurchases: { type: Number, default: 0 },
    lastPurchaseDate: Date,

    // Additional Info
    notes: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes for search and performance
CustomerSchema.index({ name: 'text', phone: 'text' });
CustomerSchema.index({ priceType: 1 });
CustomerSchema.index({ balance: 1 });
CustomerSchema.index({ 'customPricing.productId': 1 });

// Method to get price for a product
CustomerSchema.methods.getPriceForProduct = function (productId) {
    const customPrice = this.customPricing.find(
        cp => cp.productId.toString() === productId.toString()
    );
    return customPrice ? customPrice.customPrice : null;
};

// Method to check credit availability
CustomerSchema.methods.canPurchaseOnCredit = function (amount) {
    return (this.balance + amount) <= this.creditLimit;
};

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
