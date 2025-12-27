import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'اسم المنتج مطلوب'],
        trim: true,
        index: 'text'
    },
    code: {
        type: String,
        required: [true, 'كود المنتج مطلوب'],
        unique: true,
        trim: true,
        index: true
    },
    brand: { type: String, trim: true },
    originCountry: { type: String, trim: true },
    category: { type: String, trim: true, index: true },
    subsection: { type: String, trim: true }, // Added Subsection support
    size: { type: String, trim: true }, // Specific attributes
    color: { type: String, trim: true },
    gender: {
        type: String,
        enum: ['men', 'women', 'kids', 'unisex'],
        default: 'unisex'
    },
    season: { type: String, trim: true },
    unit: {
        type: String,
        default: 'pcs',
        enum: ['pcs', 'kg', 'm', 'box']
    },

    // Multi-Tier Pricing
    buyPrice: { type: Number, required: true, min: 0 },
    retailPrice: { type: Number, required: true, min: 0 }, // Selling price for retail customers (قطاعي)
    wholesalePrice: { type: Number, min: 0 }, // Selling price for wholesale customers (جملة)
    // Profit margin settings
    minProfitMargin: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }, // Minimum profit margin percentage set by owner
    specialPrice: { type: Number, min: 0 }, // Selling price for special pricing tier
    lastPriceChange: { type: Date }, // Track when prices were last updated

    // Inventory - Separate Source of Truth
    stockQty: { type: Number, default: 0 }, // Should ideally be computed, but keeping as cached total
    warehouseQty: { type: Number, default: 0, min: 0 },
    shopQty: { type: Number, default: 0, min: 0 },

    minLevel: { type: Number, default: 5 },

    images: [String], // Cloudinary URLs
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware to ensure stockQty is always sync
ProductSchema.pre('save', async function () {
    if (this.isModified('warehouseQty') || this.isModified('shopQty')) {
        this.stockQty = (this.warehouseQty || 0) + (this.shopQty || 0);
    }

    // Debug log to confirm new middleware is loaded
    // console.log(`Product pre-save: Updating stockQty to ${this.stockQty}`);

    // Track price changes
    if (this.isModified('retailPrice') || this.isModified('wholesalePrice') || this.isModified('specialPrice') || this.isModified('buyPrice')) {
        this.lastPriceChange = new Date();
    }

    // Auto-set wholesale and special prices if not provided
    if (this.isNew || this.isModified('retailPrice')) {
        if (!this.wholesalePrice) {
            this.wholesalePrice = this.retailPrice * 0.9; // 10% discount for wholesale
        }
        if (!this.specialPrice) {
            this.specialPrice = this.retailPrice; // Default to retail price
        }
    }
});

// Method to get price based on customer tier
ProductSchema.methods.getPrice = function (priceType = 'retail') {
    switch (priceType) {
        case 'wholesale':
            return this.wholesalePrice || this.retailPrice;
        case 'special':
            return this.specialPrice || this.retailPrice;
        case 'retail':
        default:
            return this.retailPrice;
    }
};

// Virtual for profit margin (retail)
ProductSchema.virtual('profitMargin').get(function () {
    if (this.buyPrice === 0) return 0;
    return ((this.retailPrice - this.buyPrice) / this.buyPrice) * 100;
});

// Force model recompilation in dev to fix cache
if (process.env.NODE_ENV !== 'production' && mongoose.models.Product) {
    delete mongoose.models.Product;
}

export default mongoose.model('Product', ProductSchema);
