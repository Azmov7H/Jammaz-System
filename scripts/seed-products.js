const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    brand: String,
    category: String,
    subsection: String,
    size: String,
    color: String,
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids', 'none'], default: 'none' },
    season: String,
    unit: { type: String, default: 'piece' },
    buyPrice: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    wholesalePrice: Number,
    specialPrice: Number,
    minProfitMargin: { type: Number, default: 0 },
    stockQty: { type: Number, default: 0 },
    warehouseQty: { type: Number, default: 0 },
    shopQty: { type: Number, default: 0 },
    openingWarehouseQty: { type: Number, default: 0 },
    openingShopQty: { type: Number, default: 0 },
    openingBuyPrice: { type: Number, default: 0 },
    minLevel: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Sports', 'Toys'];
const BRANDS = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE'];
const COLORS = ['Red', 'Blue', 'Green', 'Black', 'White'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const GENDERS = ['men', 'women', 'unisex', 'kids'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedProducts() {
    try {
        const uri = MONGODB_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const products = [];
        for (let i = 1; i <= 1000; i++) {
            const buyPrice = Math.floor(Math.random() * 100) + 10;
            const retailPrice = Math.floor(buyPrice * 1.5);
            const warehouseQty = Math.floor(Math.random() * 100);
            const shopQty = Math.floor(Math.random() * 50);

            products.push({
                name: `Product ${i}`,
                code: `PROD-${10000 + i}`,
                brand: getRandomItem(BRANDS),
                category: getRandomItem(CATEGORIES),
                subsection: 'General',
                size: getRandomItem(SIZES),
                color: getRandomItem(COLORS),
                gender: getRandomItem(GENDERS),
                season: 'All Season',
                buyPrice: buyPrice,
                retailPrice: retailPrice,
                wholesalePrice: Math.floor(retailPrice * 0.9),
                specialPrice: Math.floor(retailPrice * 0.95),
                warehouseQty: warehouseQty,
                shopQty: shopQty,
                stockQty: warehouseQty + shopQty,
                minLevel: 5,
                isActive: true
            });
        }

        console.log('Inserting 1000 products...');
        await Product.insertMany(products);
        console.log('Successfully seeded 1000 products');

    } catch (error) {
        console.error('Error seeding products:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit();
    }
}

seedProducts();
