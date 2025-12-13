import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ShortageReport from '@/models/ShortageReport';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        await dbConnect();

        // Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);

        const body = await request.json();
        const { productId, productName, requestedQty, availableQty, notes } = body;

        const report = await ShortageReport.create({
            product: productId,
            productName,
            requestedQty,
            availableQty,
            requester: decoded?.userId,
            requesterName: decoded?.name || 'Unknown',
            notes
        });

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error('Shortage Report Error:', error);
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = {};
        if (status) query.status = status;

        const reports = await ShortageReport.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ reports });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
