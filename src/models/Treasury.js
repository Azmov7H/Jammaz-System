import mongoose from 'mongoose';

const TreasurySchema = new mongoose.Schema({
    balance: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// We generally only need one treasury document for a single-store system.
export default mongoose.models.Treasury || mongoose.model('Treasury', TreasurySchema);
