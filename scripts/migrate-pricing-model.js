// Migration script to update existing data for new pricing model
// Run with: node scripts/migrate-pricing-model.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function migratePricingModel() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // Get models
        const Product = mongoose.model('Product');
        const Customer = mongoose.model('Customer');
        const Invoice = mongoose.model('Invoice');

        // 1. Migrate Products: sellPrice → retailPrice
        console.log('\n📦 Migrating products...');
        const products = await Product.find({});
        let productCount = 0;

        for (const product of products) {
            // If old sellPrice exists and retailPrice doesn't
            if (product.sellPrice && !product.retailPrice) {
                product.retailPrice = product.sellPrice;
                product.wholesalePrice = Math.round(product.sellPrice * 0.9); // 10% discount
                product.specialPrice = product.sellPrice;
                await product.save();
                productCount++;
            }
            // If retailPrice exists but wholesale/special don't
            else if (product.retailPrice && !product.wholesalePrice) {
                product.wholesalePrice = Math.round(product.retailPrice * 0.9);
                product.specialPrice = product.retailPrice;
                await product.save();
                productCount++;
            }
        }
        console.log(`✅ Migrated ${productCount} products`);

        // 2. Migrate Customers: add default priceType
        console.log('\n👥 Migrating customers...');
        const customerResult = await Customer.updateMany(
            { priceType: { $exists: false } },
            {
                $set: {
                    priceType: 'retail',
                    balance: 0,
                    creditLimit: 0,
                    customPricing: []
                }
            }
        );
        console.log(`✅ Migrated ${customerResult.modifiedCount} customers`);

        // 3. Migrate Invoices: add payment defaults
        console.log('\n📄 Migrating invoices...');
        const invoices = await Invoice.find({});
        let invoiceCount = 0;

        for (const invoice of invoices) {
            let modified = false;

            // Set default payment type if not exists
            if (!invoice.paymentType) {
                invoice.paymentType = 'cash';
                invoice.paymentStatus = 'paid';
                invoice.paidAmount = invoice.total;
                modified = true;
            }

            // Calculate profit if not set
            if (invoice.items && invoice.items.length > 0) {
                let needsCostCalculation = false;

                for (const item of invoice.items) {
                    if (!item.costPrice) {
                        const product = await Product.findById(item.productId);
                        if (product) {
                            item.costPrice = product.buyPrice;
                            item.profit = (item.unitPrice - product.buyPrice) * item.qty;
                            needsCostCalculation = true;
                        }
                    }
                }

                if (needsCostCalculation || !invoice.totalCost) {
                    invoice.totalCost = invoice.items.reduce((sum, item) => {
                        return sum + ((item.costPrice || 0) * item.qty);
                    }, 0);
                    invoice.profit = invoice.total - invoice.totalCost;
                    modified = true;
                }
            }

            // Set customer price type snapshot if missing
            if (invoice.customer && !invoice.customerPriceType) {
                const customer = await Customer.findById(invoice.customer);
                if (customer) {
                    invoice.customerPriceType = customer.priceType || 'retail';
                    modified = true;
                }
            }

            if (modified) {
                await invoice.save();
                invoiceCount++;
            }
        }
        console.log(`✅ Migrated ${invoiceCount} invoices`);

        console.log('\n✅ Migration completed successfully!');

        // Show summary
        console.log('\n=== MIGRATION SUMMARY ===');
        console.log(`Products updated: ${productCount}`);
        console.log(`Customers updated: ${customerResult.modifiedCount}`);
        console.log(`Invoices updated: ${invoiceCount}`);

    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

// Run migration
migratePricingModel();
