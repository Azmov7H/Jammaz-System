import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
    try {
        await dbConnect();
        const currentUser = await getCurrentUser();
        // Strict: Only Owner/Manager can update. Owner can update anyone. Manager permissions debatable.
        // Let's allow Owner and Manager.
        if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'manager')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, role, password } = body;

        const updateData = { name, role };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const currentUser = await getCurrentUser();
        // Only Owner can delete users
        if (!currentUser || currentUser.role !== 'owner') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        await User.findByIdAndDelete(id);

        return NextResponse.json({ message: 'User deleted' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
