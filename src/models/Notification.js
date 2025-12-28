import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'],
        default: 'INFO'
    },
    isRead: { type: Boolean, default: false },
    link: String, // Optional link to navigate to (e.g., specific invoice)
    actionType: {
        type: String,
        enum: ['COLLECT_DEBT', 'PAY_SUPPLIER', null],
        default: null
    },
    relatedId: mongoose.Schema.Types.ObjectId, // ID of Invoice or PO
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: if null, it's a system-wide notification for admins/owners
    createdAt: { type: Date, default: Date.now, expires: '30d' } // Auto-delete after 30 days
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
