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
