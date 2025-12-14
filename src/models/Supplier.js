import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: String,
    address: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Financials
    balance: { type: Number, default: 0 }, // Positive = You owe them (Credit)
    isActive: { type: Boolean, default: true },

    lastSupplyDate: Date
});

export default mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
