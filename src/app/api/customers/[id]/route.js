import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params; // Await params in Next.js 15+ (if applicable, but good practice here too if this version requires it, though 16 usually does)
        // Checking next version in package.json: it was ^16.0.10. Yes, params should be awaited or treated carefully in newer versions.

        const customer = await Customer.findById(id).lean();
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

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        // Handle unique phone error duplication
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
        // Only Owner/Manager can delete
        if (!user || (user.role !== 'owner' && user.role !== 'manager')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Check for dependencies (Invoices)
        // We assume soft delete is safer, but user asked for logic.
        // Let's check balance. If balance != 0, cannot delete.
        const customer = await Customer.findById(id);
        if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (customer.balance !== 0) {
            return NextResponse.json({ error: 'لا يمكن حذف عميل لديه رصيد مالي (مدين/دائن)' }, { status: 400 });
        }

        // Hard delete or Soft delete? Using Soft Delete logic based on model isActive field
        customer.isActive = false;
        await customer.save();

        return NextResponse.json({ message: 'Customer deactivated successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
