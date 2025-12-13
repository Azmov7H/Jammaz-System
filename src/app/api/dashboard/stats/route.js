import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Invoice from '@/models/Invoice';
import StockMovement from '@/models/StockMovement';

export async function GET() {
    try {
        await dbConnect();
        // Just to be safe, though middleware handles it
        // const user = await verifyToken(request);
        // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); 
        // Commenting out explicit auth check here if request is not available or if I want to rely on middleware for GET.
        // But for refactor consistency, let's keep it simple. middleware is enough for valid token presence.
        // Actually, let's look at `StockMovement` aggregation. It doesn't filter by user, which is correct (Owner sees all).
        // If I want to filter by user permissions?
        // Current requirement: "No data appears".
        // Let's ensure no error occurs if collections are empty.


        // Parallelize queries for performance
        const [
            productsCount,
            lowStockCount,
            invoicesCount,
            totalSalesResult,
            recentInvoices,
            topSellingProducts
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ $expr: { $lte: ["$stockQty", "$minLevel"] } }),
            Invoice.countDocuments(),
            Invoice.aggregate([
                { $group: { _id: null, total: { $sum: "$total" } } }
            ]),
            Invoice.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name'),
            // Simple top selling based on stock movement OUT type. 
            // Better approach: Aggregate Invoice Items. For now, we can aggregate StockMovement type 'OUT_SALE'
            StockMovement.aggregate([
                { $match: { type: 'OUT_SALE' } },
                { $group: { _id: "$productId", totalQty: { $sum: "$quantity" } } },
                { $sort: { totalQty: -1 } },
                { $limit: 5 },
                { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
                { $unwind: "$product" },
                { $project: { name: "$product.name", totalQty: 1 } }
            ])
        ]);

        // Monthly Sales Aggregation (Last 6 months)
        const monthlySales = await Invoice.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    sales: { $sum: "$total" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Format monthly sales for Chart (0-12 to Month Names)
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const chartData = monthlySales.map(item => ({
            name: months[item._id - 1],
            sales: item.sales
        }));

        return NextResponse.json({
            stats: {
                products: productsCount,
                lowStock: lowStockCount,
                invoices: invoicesCount,
                sales: totalSalesResult[0]?.total || 0,
            },
            chartData: chartData.length > 0 ? chartData : [{ name: 'لا يوجد بيانات', sales: 0 }],
            topSelling: topSellingProducts,
            recentInvoices
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
