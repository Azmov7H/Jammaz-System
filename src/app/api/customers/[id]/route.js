import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import { getCurrentUser } from '@/lib/auth';
import { CACHE_TAGS } from '@/lib/cache';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        // Use cached method for speed
        const customer = await Customer.getByIdCached(id);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();

        // Prevent updating balance directly via edit API
        delete body.balance;
        delete body.totalPurchases;

        const updatedCustomer = await Customer.findByIdAndUpdate(
            id,
            { ...body },
            { new: true, runValidators: true }
        );

        if (!updatedCustomer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Revalidate cache
        revalidateTag(CACHE_TAGS.CUSTOMERS);
        revalidateTag(`customer-${id}`);

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user || (user.role !== 'owner' && user.role !== 'manager')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const customer = await Customer.findById(id);
        if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (customer.balance !== 0) {
            return NextResponse.json({ error: 'لا يمكن حذف عميل لديه رصيد مالي (مدين/دائن)' }, { status: 400 });
        }

        customer.isActive = false;
        await customer.save();

        // Revalidate cache
        revalidateTag(CACHE_TAGS.CUSTOMERS);
        revalidateTag(`customer-${id}`);

        return NextResponse.json({ message: 'Customer deactivated successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
