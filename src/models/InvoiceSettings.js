import mongoose from 'mongoose';

const InvoiceSettingsSchema = new mongoose.Schema({
    // Company Information
    companyName: {
        type: String,
        default: 'مؤسستي'
    },
    companyLogo: {
        type: String, // URL to uploaded logo
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },

    // Design Customization
    primaryColor: {
        type: String,
        default: '#3b82f6' // Blue
    },
    secondaryColor: {
        type: String,
        default: '#64748b' // Slate
    },
    headerBgColor: {
        type: String,
        default: '#f8fafc' // Light slate
    },

    // Display Options
    showLogo: {
        type: Boolean,
        default: true
    },
    showQRCode: {
        type: Boolean,
        default: true
    },
    footerText: {
        type: String,
        default: 'شكراً لتعاملكم معنا'
    },

    // Template Type
    invoiceTemplate: {
        type: String,
        enum: ['modern', 'classic', 'minimal'],
        default: 'modern'
    },

    // Notification Settings
    stockAlertThreshold: {
        type: Number,
        default: 5
    },
    supplierPaymentAlertDays: {
        type: Number,
        default: 3
    },
    customerCollectionAlertDays: {
        type: Number,
        default: 3
    },
    defaultCustomerTerms: {
        type: Number,
        default: 15
    },
    defaultSupplierTerms: {
        type: Number,
        default: 15
    },
    minDebtNotificationAmount: {
        type: Number,
        default: 10
    },

    // Inactivity Alerts
    inactiveCustomerThresholdDays: {
        type: Number,
        default: 30
    },

    // Loyalty Settings
    pointsPerEGP: {
        type: Number,
        default: 0.01 // Default: 1 point per 100 EGP
    },
    egpPerPoint: {
        type: Number,
        default: 0.1 // Default: 100 points = 10 EGP
    },

    // Only one settings document should exist
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Singleton pattern - only one settings document
InvoiceSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ isActive: true });
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

export default mongoose.models.InvoiceSettings || mongoose.model('InvoiceSettings', InvoiceSettingsSchema);
