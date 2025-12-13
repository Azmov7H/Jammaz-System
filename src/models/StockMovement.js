import mongoose from 'mongoose';

const StockMovementSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: {
        type: String,
        enum: ['IN', 'OUT', 'ADJUST', 'TRANSFER'],
        required: true
    },
    qty: { type: Number, required: true }, // Positive for IN, Negative for OUT usually, or absolute value handled by logic
    note: String,
    refId: String, // e.g., Invoice Number
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
});

export default mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema);
