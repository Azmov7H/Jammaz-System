import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PhysicalInventoryService } from '@/lib/services/physicalInventoryService';
import { getCurrentUser } from '@/lib/auth';
import { use } from 'react';

export async function POST(request, { params }) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'الرجاء إدخال كلمة المرور' }, { status: 400 });
        }

        const count = await PhysicalInventoryService.unlockCount(id, password, user.userId);

        return NextResponse.json({
            success: true,
            message: 'تم فتح الجرد للتعديل بنجاح',
            count
        });

    } catch (error) {
        console.error('Error unlocking physical count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
