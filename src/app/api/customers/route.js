import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import { getCurrentUser } from '@/lib/auth';
import { CACHE_TAGS } from '@/lib/cache';

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
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Use cached method for speed
        const customers = await Customer.getAllCached(query);
        const paginatedCustomers = customers.slice(skip, skip + limit);
        const total = customers.length;

        return NextResponse.json({
            customers: paginatedCustomers,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();

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

        // Revalidate cache
        revalidateTag(CACHE_TAGS.CUSTOMERS);

        return NextResponse.json(newCustomer, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
