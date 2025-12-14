import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const dateQuery = {};
        if (startDate && endDate) {
            dateQuery.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Aggregate by customer
        const report = await Invoice.aggregate([
            { $match: dateQuery },
            {
                $group: {
                    _id: '$customer',
                    totalRevenue: { $sum: '$total' },
                    totalProfit: { $sum: '$profit' }, // Assumes profit field exists on invoice
                    invoiceCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            {
                $unwind: '$customerDetails'
            },
            {
                $project: {
                    _id: 1,
                    customerName: '$customerDetails.name',
                    totalRevenue: 1,
                    totalProfit: 1,
                    invoiceCount: 1,
                    profitMargin: {
                        $cond: [
                            { $eq: ['$totalRevenue', 0] },
                            0,
                            { $multiply: [{ $divide: ['$totalProfit', '$totalRevenue'] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { totalProfit: -1 } }
        ]);

        return NextResponse.json({ report });

    } catch (error) {
        console.error('Customer Profit Report Error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
