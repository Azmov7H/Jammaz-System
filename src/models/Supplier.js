import mongoose from 'mongoose';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_TIMES } from '@/lib/cache';

const SupplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: String,
    address: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Financials
    balance: { type: Number, default: 0 }, // Positive = You owe them (Credit)
    isActive: { type: Boolean, default: true },

    lastSupplyDate: Date,

    // Financial Tracking / Debt Control
    financialTrackingEnabled: { type: Boolean, default: true },
    paymentDay: {
        type: String,
        enum: ['None', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        default: 'None'
    },
    supplyTerms: { type: Number, default: 0 } // 0 means use global default
}, { timestamps: true });

// Static methods with Caching
SupplierSchema.statics.getAllCached = async function (filter = {}) {
    const Model = this;
    const filterKey = JSON.stringify(filter);
    return unstable_cache(
        async () => {
            console.log(`Fetching suppliers from DB [Filter: ${filterKey}]`);
            return Model.find(filter).sort({ name: 1 }).lean();
        },
        ['suppliers-list', filterKey],
        {
            tags: [CACHE_TAGS.SUPPLIERS],
            revalidate: CACHE_TIMES.FREQUENT
        }
    )();
};

SupplierSchema.statics.getByIdCached = async function (id) {
    const Model = this;
    return unstable_cache(
        async () => {
            console.log(`Fetching supplier ${id} from DB`);
            return Model.findById(id).lean();
        },
        ['supplier-detail', id],
        {
            tags: [CACHE_TAGS.SUPPLIERS, `supplier-${id}`],
            revalidate: CACHE_TIMES.FREQUENT
        }
    )();
};

export default mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
