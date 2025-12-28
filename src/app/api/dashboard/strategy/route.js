import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import { startOfMonth, subMonths } from 'date-fns';

export async function GET() {
    try {
        await dbConnect();
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 6);

        // 1. Bundle Suggestions (Simple co-occurrence)
        // Find products often bought together in the last 6 months
        const recentInvoices = await Invoice.find({ date: { $gte: sixMonthsAgo } }).limit(500);
        const pairs = {};

        recentInvoices.forEach(inv => {
            const productIds = inv.items.map(item => item.productId.toString());
            for (let i = 0; i < productIds.length; i++) {
                for (let j = i + 1; j < productIds.length; j++) {
                    const key = [productIds[i], productIds[j]].sort().join(',');
                    pairs[key] = (pairs[key] || 0) + 1;
                }
            }
        });

        const topPairs = Object.entries(pairs)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        const bundleSuggestions = await Promise.all(topPairs.map(async ([pair, count]) => {
            const [id1, id2] = pair.split(',');
            const p1 = await Product.findById(id1).select('name');
            const p2 = await Product.findById(id2).select('name');
            return {
                title: 'اقتراح حزمة منتجات (Bundle)',
                desc: `تم شراء "${p1?.name}" و "${p2?.name}" معاً في ${count} فواتير مؤخراً. قم بعمل عرض خاص عند شرائهما معاً.`,
                impact: 'عالي',
                type: 'bundle'
            };
        }));

        // 2. ABC Analysis (Revenue based)
        const products = await Product.find({ isActive: true }).lean();
        const productStats = products.map(p => ({
            id: p._id,
            name: p.name,
            totalRevenue: 0, // Will populate
            buyPrice: p.buyPrice
        }));

        // Populate revenue from last month
        const lastMonthInvoices = await Invoice.find({ date: { $gte: startOfMonth(subMonths(now, 1)) } });
        lastMonthInvoices.forEach(inv => {
            inv.items.forEach(item => {
                const stat = productStats.find(s => s.id.toString() === item.productId.toString());
                if (stat) stat.totalRevenue += item.total;
            });
        });

        const sortedStats = productStats.sort((a, b) => b.totalRevenue - a.totalRevenue);
        const top20Count = Math.ceil(sortedStats.length * 0.2);
        const categoryA = sortedStats.slice(0, top20Count);

        const abcSuggestion = {
            title: 'تحليل ABC للمخزون',
            desc: `20% من منتجاتك (مثل ${categoryA.slice(0, 2).map(p => p.name).join('، ')}) تحقق الجزء الأكبر من أرباحك. ركز على توفرها بشكل دائم.`,
            impact: 'عالي',
            type: 'abc'
        };

        // 3. Stock Reorder suggestions (Velocity based)
        const reorderSuggestions = [];
        const lowVelocityProducts = sortedStats.filter(p => p.totalRevenue > 0).slice(-3);
        if (lowVelocityProducts.length > 0) {
            reorderSuggestions.push({
                title: 'تحسين المخزون الراكد',
                desc: `المنتجات مثل (${lowVelocityProducts.map(p => p.name).join('، ')}) لديها حركة بطيئة جداً. نقترح عمل تصفية أو تقليل الكميات المطلوبة مستقبلاً.`,
                impact: 'متوسط',
                type: 'reorder'
            });
        }

        return NextResponse.json({
            suggestions: [...bundleSuggestions, abcSuggestion, ...reorderSuggestions],
            stats: {
                bundleCount: topPairs.length,
                abcReady: true
            }
        });

    } catch (error) {
        console.error('Strategy API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
