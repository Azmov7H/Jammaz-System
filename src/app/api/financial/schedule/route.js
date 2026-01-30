import { apiHandler } from '@/lib/api-handler';
import PaymentSchedule from '@/models/PaymentSchedule';
import mongoose from 'mongoose';

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');
    const entityType = searchParams.get('entityType');

    if (!entityId || !entityType) {
        throw 'Entity ID and Type are required';
    }

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
        throw 'Invalid Entity ID format';
    }

    const schedules = await PaymentSchedule.find({
        entityId,
        entityType,
        status: { $in: ['PENDING', 'OVERDUE'] }
    }).sort({ dueDate: 1 });

    return { schedules };
}, { auth: true });

export const POST = apiHandler(async (req) => {
    const body = await req.json();

    // Expecting { entityId, entityType, schedules: [{ amount, dueDate, notes }] }
    const { entityId, entityType, schedules } = body;

    // Validation
    if (!entityId) throw 'Missing entityId';
    if (!mongoose.Types.ObjectId.isValid(entityId)) throw 'Invalid entityId format';
    if (!Reflect.has(body, 'schedules')) throw 'Missing schedules field';
    if (!Array.isArray(schedules)) throw 'schedules must be an array';

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

    return { success: true, count: created.length, schedules: created };
}, { auth: true });
