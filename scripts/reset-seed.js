const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Schema definitions needed for seeding (simplified)
const ProductSchema = new mongoose.Schema({
    name: String,
    code: String,
    brand: String,
    category: String,
    buyPrice: Number,
    sellPrice: Number,
    warehouseQty: Number,
    shopQty: Number,
    stockQty: Number, // Computed
    minLevel: Number,
}, { timestamps: true });

const TreasurySchema = new mongoose.Schema({ balance: Number, lastUpdated: Date });

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
}

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Clear Data
        console.log('🧹 Clearing Collections...');
        const collections = ['products', 'customers', 'suppliers', 'invoices', 'purchaseorders', 'treasurytransactions', 'treasuries', 'shortagereports'];

        for (const col of collections) {
            try {
                await mongoose.connection.collection(col).drop();
            } catch (e) {
                // Ignore if collection doesn't exist
            }
        }
        console.log('✨ Data Cleared');

        // 2. Models
        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
        const Treasury = mongoose.models.Treasury || mongoose.model('Treasury', TreasurySchema);

        // 3. Seed Products (Tools & Construction)
        // Aiming for varying prices.
        const products = [
            { name: "شنيور بوش 13 مم", code: "BOSCH-13", brand: "Bosch", category: "Power Tools", buyPrice: 1200, sellPrice: 1550, shopQty: 5, warehouseQty: 10 },
            { name: "صاروخ ماكيتا 9 بوصة", code: "MAK-9IN", brand: "Makita", category: "Power Tools", buyPrice: 2500, sellPrice: 3100, shopQty: 3, warehouseQty: 5 },
            { name: "طقم مفكات احترافي", code: "TOTAL-SD", brand: "Total", category: "Hand Tools", buyPrice: 450, sellPrice: 600, shopQty: 20, warehouseQty: 50 },
            { name: "شاكوش تكسير 15 كيلو", code: "CROWN-15", brand: "Crown", category: "Heavy Equipment", buyPrice: 4500, sellPrice: 5800, shopQty: 1, warehouseQty: 2 },
            { name: "متر ليزر 50 متر", code: "INGCO-L50", brand: "Ingco", category: "Measurement", buyPrice: 800, sellPrice: 1100, shopQty: 5, warehouseQty: 5 },
            { name: "سلم الومنيوم 7 درجات", code: "LADDER-7", brand: "Generic", category: "Construction", buyPrice: 1100, sellPrice: 1400, shopQty: 4, warehouseQty: 0 },
            { name: "كمبروسر هواء 50 لتر", code: "APT-50L", brand: "APT", category: "Air Tools", buyPrice: 3200, sellPrice: 3900, shopQty: 2, warehouseQty: 4 },
            { name: "ماكينة لحام انفرتر", code: "WELD-200", brand: "Total", category: "Welding", buyPrice: 1800, sellPrice: 2300, shopQty: 3, warehouseQty: 6 },
            { name: "حذاء سيفتي للكناسة", code: "SAFETY-43", brand: "CAT", category: "Safety", buyPrice: 900, sellPrice: 1250, shopQty: 10, warehouseQty: 10 },
            { name: "ديسك قطعية 14 بوصة", code: "DEWALT-14", brand: "DeWalt", category: "Power Tools", buyPrice: 5500, sellPrice: 6800, shopQty: 2, warehouseQty: 3 }
        ];

        // Recalculate stockQty and insert
        const formattedProducts = products.map(p => ({
            ...p,
            stockQty: p.shopQty + p.warehouseQty,
            minLevel: 5
        }));

        await Product.insertMany(formattedProducts);
        console.log(`📦 Seeded ${products.length} Products`);

        // 4. Initialize Treasury
        await Treasury.create({ balance: 0, lastUpdated: new Date() });
        console.log('💰 Treasury Initialized to 0');

        console.log('✅ Database Reset & Seed Completed Successflly!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedData();
