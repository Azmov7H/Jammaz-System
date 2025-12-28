import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer'; // Ensuring we use the existing model
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        await dbConnect();

        // Security Check
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit')) || 20;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Active only by default, unless specified? Let's just show active for now.
        // query.isActive = true; 

        const customers = await Customer.find(query)
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean(); // Faster

        return NextResponse.json(customers);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();

        // Security Check - Owner/Manager/Cashier can create?
        // Let's restrict creation to Owner/Manager/Cashier
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, phone, priceType, creditLimit, address, notes, financialTrackingEnabled, collectionDay, paymentTerms } = body;

        // Validation
        if (!name || !phone) {
            return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
        }

        // Check Unique Phone
        const existing = await Customer.findOne({ phone });
        if (existing) {
            return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل لعميل آخر' }, { status: 400 });
        }

        const newCustomer = await Customer.create({
            name,
            phone,
            priceType: priceType || 'retail',
            creditLimit: creditLimit || 0,
            address,
            notes,
            isActive: true,
            financialTrackingEnabled: financialTrackingEnabled !== undefined ? financialTrackingEnabled : true,
            collectionDay: collectionDay || 'None',
            paymentTerms: paymentTerms || 0
        });

        return NextResponse.json(newCustomer, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
