import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, unique: true, required: true },
    email: String,
    address: String,
    totalPurchases: { type: Number, default: 0 },
    lastPurchaseDate: Date
}, { timestamps: true });

// Index for search
CustomerSchema.index({ name: 'text', phone: 'text' });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
