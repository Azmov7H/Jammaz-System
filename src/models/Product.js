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

// Indexes
// ProductSchema.index({ code: 1 }, { unique: true }); // Already defined in schema
// ProductSchema.index({ stockQty: 1 }); // Already defined in schema

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
