import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR', 'CRITICAL', 'OPPORTUNITY'],
        default: 'INFO'
    },
    category: {
        type: String,
        enum: ['CRITICAL', 'OPPORTUNITY', 'INSIGHT', 'SYSTEM', 'FINANCIAL', 'WARNING'],
        default: 'SYSTEM'
    },
    isRead: { type: Boolean, default: false },
    link: String,
    actionType: {
        type: String,
        enum: ['COLLECT_DEBT', 'PAY_SUPPLIER', 'REORDER', 'OPTIMIZE_PRICE', 'VIEW_REPORT', null],
        default: null
    },
    actionParams: { type: Object, default: {} }, // Custom params for actions
    relatedId: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now, expires: '30d' }
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
