
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['owner', 'manager', 'cashier', 'warehouse', 'viewer'], default: 'cashier' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createOwner() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const email = 'o@o.com';
        const password = '123456';
        const hashedPassword = await bcrypt.hash(password, 10);

        const owner = await User.findOneAndUpdate(
            { email },
            {
                name: 'صلاح الجماز',
                email,
                password: hashedPassword,
                role: 'owner',
                isActive: true
            },
            { upsert: true, new: true }
        );

        console.log('Owner user created/updated successfully:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Role:', owner.role);

    } catch (error) {
        console.error('Error creating owner:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit(0);
    }
}

createOwner();
