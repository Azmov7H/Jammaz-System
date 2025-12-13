import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    brand: String,
    originCountry: String,
    category: String,
    unit: { type: String, default: 'pcs' },
    sellPrice: { type: Number, required: true },
    buyPrice: { type: Number, required: true },
    stockQty: { type: Number, default: 0, index: true }, // Total (Shop + Warehouse)
    warehouseQty: { type: Number, default: 0 },
    shopQty: { type: Number, default: 0 },
    minLevel: { type: Number, default: 5 },
    images: [String],
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
}, { timestamps: true });

// Indexes for faster search
ProductSchema.index({ name: 'text' });
ProductSchema.index({ code: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
