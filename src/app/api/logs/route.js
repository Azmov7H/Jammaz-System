import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Log from '@/models/Log';

export async function GET(request) {
    try {
        await dbConnect();
        const logs = await Log.find({})
            .populate('userId', 'name')
            .sort({ date: -1 })
            .limit(100);
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
