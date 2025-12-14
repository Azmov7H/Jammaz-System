import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DailySales from '@/models/DailySales';
import { DailySalesService } from '@/lib/services/dailySalesService';

/**
 * Get daily sales summary
 */
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date'); // YYYY-MM-DD format
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        // Single date query
        if (dateStr) {
            const date = new Date(dateStr);
            const dailySales = await DailySalesService.getDailySales(date);

            if (!dailySales) {
                return NextResponse.json({
                    message: 'لا توجد مبيعات لهذا اليوم',
                    date: dateStr
                });
            }

            return NextResponse.json({ dailySales });
        }

        // Date range query
        if (startDateStr && endDateStr) {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            const summary = await DailySalesService.getSalesSummary(startDate, endDate);
            return NextResponse.json(summary);
        }

        // Default: Get last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const summary = await DailySalesService.getSalesSummary(startDate, endDate);
        return NextResponse.json(summary);

    } catch (error) {
        console.error('Daily Sales Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
