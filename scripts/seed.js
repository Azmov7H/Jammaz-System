const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define MONGODB_URI in .env');
    process.exit(1);
}

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const UserSchema = new mongoose.Schema({
            name: String,
            email: String,
            password: String,
            role: { type: String, enum: ['owner', 'manager', 'cashier', 'warehouse'], default: 'cashier' },
            picture: String,
            createdAt: { type: Date, default: Date.now }
        });

        const SupplierSchema = new mongoose.Schema({ name: String, phone: String, email: String, address: String });

        // Product schema matching proper key names
        const ProductSchema = new mongoose.Schema({
            name: String,
            code: String,
            sellPrice: Number,
            buyPrice: Number,
            stockQty: Number,
            minLevel: Number,
            supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
            category: String,
            brand: String
        });

        const InvoiceSchema = new mongoose.Schema({
            number: String,
            total: Number,
            status: String,
            date: { type: Date, default: Date.now },
            customer: String
        });

        const StockMovementSchema = new mongoose.Schema({
            type: String,
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
            date: { type: Date, default: Date.now }
        });

        // Register models
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
        const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
        const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
        const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema);

        // Clear Database
        await User.deleteMany({});
        await Product.deleteMany({});
        await Supplier.deleteMany({});
        await Invoice.deleteMany({});
        await StockMovement.deleteMany({});
        console.log('🗑️  Cleared Database');

        // Create Users
        const hashedPassword = await bcrypt.hash('123456', 10);
        const users = [
            {
                name: 'المالك',
                email: 'owner@example.com',
                password: hashedPassword,
                role: 'owner',
                picture: 'https://ui-avatars.com/api/?name=Owner&background=1B3C73&color=fff'
            },
            {
                name: 'مدير الفرع',
                email: 'manager@example.com',
                password: hashedPassword,
                role: 'manager',
                picture: 'https://ui-avatars.com/api/?name=Manager&background=3b82f6&color=fff'
            },
            {
                name: 'كاشير 1',
                email: 'cashier@example.com',
                password: hashedPassword,
                role: 'cashier',
                picture: 'https://ui-avatars.com/api/?name=Cashier&background=22c55e&color=fff'
            },
            {
                name: 'أمين المستودع',
                email: 'warehouse@example.com',
                password: hashedPassword,
                role: 'warehouse',
                picture: 'https://ui-avatars.com/api/?name=Warehouse&background=f59e0b&color=fff'
            }
        ];

        await User.insertMany(users);
        console.log('✅ Created 4 Users (Owner, Manager, Cashier, Warehouse)');

        // Create Suppliers (Egypt Localized)
        const suppliers = await Supplier.insertMany([
            { name: 'شركة النور للدهانات', phone: '01012345678', email: 'elnoor@example.com', address: 'القاهرة - وسط البلد' },
            { name: 'مؤسسة الأهرام للتوريدات', phone: '01198765432', email: 'ahram@example.com', address: 'الجيزة - الهرم' },
            { name: 'المتحدة للعدد والأدوات', phone: '01255555555', email: 'united@example.com', address: 'الإسكندرية - سموحة' }
        ]);
        console.log('✅ Created 3 Suppliers (Egypt Localized)');

        // Create Products (Hardware / Tools)
        const products = [
            {
                name: 'منشار دائري 7 بوصة - ماكيتا',
                code: 'SAW-MAK-700',
                sellPrice: 450,
                buyPrice: 380,
                stockQty: 20,
                warehouseQty: 20,
                shopQty: 0,
                minLevel: 5,
                category: 'Mineshar',
                brand: 'Makita',
                supplier: suppliers[0]._id
            },
            {
                name: 'ديسك قطع حديد 14 بوصة - بوش',
                code: 'DISC-BOS-14',
                sellPrice: 35,
                buyPrice: 22,
                stockQty: 100,
                warehouseQty: 100,
                shopQty: 0,
                minLevel: 20,
                category: 'Mineshar',
                brand: 'Bosch',
                supplier: suppliers[0]._id
            },
            {
                name: 'ورق صنفرة خشن #60 - لفة كاملة',
                code: 'SND-P60-ROLL',
                sellPrice: 120,
                buyPrice: 85,
                stockQty: 15,
                warehouseQty: 15,
                shopQty: 0,
                minLevel: 3,
                category: 'Sanding',
                brand: '3M',
                supplier: suppliers[1]._id
            },
            {
                name: 'ماكينة صنفرة مدارية',
                code: 'SND-MCH-ORB',
                sellPrice: 280,
                buyPrice: 210,
                stockQty: 8,
                warehouseQty: 8,
                shopQty: 0,
                minLevel: 2,
                category: 'Sanding',
                brand: 'DeWalt',
                supplier: suppliers[1]._id
            },
            {
                name: 'شفرة منشار أركت (خشب)',
                code: 'BLD-JIG-WD',
                sellPrice: 15,
                buyPrice: 8,
                stockQty: 200,
                warehouseQty: 200,
                shopQty: 0,
                minLevel: 50,
                category: 'Mineshar',
                brand: 'Bosch',
                supplier: suppliers[2]._id
            },
            {
                name: 'حجر تجليخ 4.5 بوصة',
                code: 'GRD-STN-45',
                sellPrice: 12,
                buyPrice: 7,
                stockQty: 150,
                warehouseQty: 150,
                shopQty: 0,
                minLevel: 30,
                category: 'Sanding',
                brand: 'Makita',
                supplier: suppliers[2]._id
            }
        ];

        const createdProducts = await Product.insertMany(products);
        console.log('✅ Created Jammaz Specific Products (Saws & Sanding)');

        // Create Mock Invoices
        const invoices = [];
        for (let i = 0; i < 10; i++) {
            invoices.push({
                number: `INV-${2024001 + i}`,
                total: Math.floor(Math.random() * 5000) + 500,
                status: 'Paid',
                date: new Date(new Date().setDate(new Date().getDate() - i)), // Past 10 days
                customer: `Customer ${i + 1}`
            });
        }
        await Invoice.insertMany(invoices);
        console.log('✅ Created 10 Sales Invoices');

        // Create Mock Stock Output (Sales)
        const movements = createdProducts.map(p => ({
            type: 'OUT_SALE',
            productId: p._id,
            quantity: Math.floor(Math.random() * 20),
            date: new Date()
        }));
        await StockMovement.insertMany(movements);
        console.log('✅ Created Stock Movements');

        console.log('🎉 Seeding Complete Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
};

seed();
