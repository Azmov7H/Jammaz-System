import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PaymentSchedule from '@/models/PaymentSchedule';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const entityId = searchParams.get('entityId');
        const entityType = searchParams.get('entityType');

        const { Types } = require('mongoose');

        if (!entityId || !entityType) {
            return NextResponse.json({ error: 'Entity ID and Type are required' }, { status: 400 });
        }

        if (!Types.ObjectId.isValid(entityId)) {
            return NextResponse.json({ error: 'Invalid Entity ID format' }, { status: 400 });
        }

        const schedules = await PaymentSchedule.find({
            entityId,
            entityType,
            status: { $in: ['PENDING', 'OVERDUE'] }
        }).sort({ dueDate: 1 });

        return NextResponse.json({ schedules });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { Types } = require('mongoose');

        // Expecting { entityId, entityType, schedules: [{ amount, dueDate, notes }] }
        const { entityId, entityType, schedules } = body;

        // Validation
        if (!entityId) {
            return NextResponse.json({ error: 'Missing entityId' }, { status: 400 });
        }
        if (!Types.ObjectId.isValid(entityId)) {
            return NextResponse.json({ error: 'Invalid entityId format' }, { status: 400 });
        }
        if (!Reflect.has(body, 'schedules')) {
            return NextResponse.json({ error: 'Missing schedules field' }, { status: 400 });
        }
        if (!Array.isArray(schedules)) {
            return NextResponse.json({ error: 'schedules must be an array' }, { status: 400 });
        }

        const created = await PaymentSchedule.create(
            schedules.map(s => ({
                entityId,
                entityType,
                amount: s.amount,
                dueDate: new Date(s.dueDate),
                notes: s.notes,
                status: 'PENDING'
            }))
        );

        return NextResponse.json({ success: true, count: created.length, schedules: created });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
