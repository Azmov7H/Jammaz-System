import mongoose from 'mongoose';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_TIMES } from '@/lib/cache';

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
    balance: {
        type: Number,
        default: 0
    }, // Accounts Receivable (positive = customer owes us)

    creditBalance: {
        type: Number,
        default: 0,
        min: 0
    }, // Customer's positive credit from refunds (can use for future purchases)ales
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
    isActive: { type: Boolean, default: true },

    // Financial Tracking / Debt Control
    financialTrackingEnabled: { type: Boolean, default: true },
    collectionDay: {
        type: String,
        enum: ['None', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        default: 'None'
    },
    paymentTerms: { type: Number, default: 0 }, // 0 means use global default

}, { timestamps: true });

// Indexes for search and performance
CustomerSchema.index({ name: 'text', phone: 'text' });
CustomerSchema.index({ priceType: 1 });
CustomerSchema.index({ balance: 1 });
CustomerSchema.index({ 'customPricing.productId': 1 });

// Static methods with Caching
CustomerSchema.statics.getAllCached = async function (filter = {}) {
    const Model = this;
    const filterKey = JSON.stringify(filter);
    return unstable_cache(
        async () => {
            console.log(`Fetching customers from DB [Filter: ${filterKey}]`);
            return Model.find(filter).sort({ name: 1 }).lean();
        },
        ['customers-list', filterKey],
        {
            tags: [CACHE_TAGS.CUSTOMERS],
            revalidate: CACHE_TIMES.FREQUENT
        }
    )();
};

CustomerSchema.statics.getByIdCached = async function (id) {
    const Model = this;
    return unstable_cache(
        async () => {
            console.log(`Fetching customer ${id} from DB`);
            return Model.findById(id).lean();
        },
        ['customer-detail', id],
        {
            tags: [CACHE_TAGS.CUSTOMERS, `customer-${id}`],
            revalidate: CACHE_TIMES.FREQUENT
        }
    )();
};

// Method to get price for a product
CustomerSchema.methods.getPriceForProduct = function (productId) {
    const customPrice = this.customPricing.find(
        cp => cp.productId.toString() === productId.toString()
    );
    return customPrice ? customPrice.customPrice : null;
};

// Method to check credit availability
CustomerSchema.methods.canPurchaseOnCredit = function (amount) {
    const limit = Number(this.creditLimit) || 0;
    const currentBalance = Number(this.balance) || 0;

    if (limit === 0) return true; // 0 means open/unlimited credit
    return (currentBalance + amount) <= limit;
};

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
