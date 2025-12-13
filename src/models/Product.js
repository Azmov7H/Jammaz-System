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

    // Financials
    sellPrice: { type: Number, required: true, min: 0 },
    buyPrice: { type: Number, required: true, min: 0 },

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
ProductSchema.pre('save', function (next) {
    if (this.isModified('warehouseQty') || this.isModified('shopQty')) {
        this.stockQty = (this.warehouseQty || 0) + (this.shopQty || 0);
    }
    next();
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
