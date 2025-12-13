import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: Search Customers
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    try {
        await dbConnect();

        // Auth check (Optional: decide if public or protected)
        // const cookieStore = await cookies();
        // const token = cookieStore.get('token')?.value;
        // if (!verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let filter = {};
        if (query) {
            filter = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { phone: { $regex: query, $options: 'i' } }
                ]
            };
        }

        const customers = await Customer.find(filter).limit(20).sort({ updatedAt: -1 });
        return NextResponse.json({ customers });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// POST: Create Customer
export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();

        if (!body.name || !body.phone) {
            return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
        }

        const existing = await Customer.findOne({ phone: body.phone });
        if (existing) {
            return NextResponse.json({ error: 'العميل مسجل مسبقاً' }, { status: 400 });
        }

        const customer = await Customer.create(body);
        return NextResponse.json({ customer }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
