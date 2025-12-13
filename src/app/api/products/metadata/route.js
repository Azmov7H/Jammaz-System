import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

export async function GET() {
    try {
        await dbConnect();
        const brands = await Product.distinct('brand');
        const categories = await Product.distinct('category');

        return NextResponse.json({
            brands: brands.filter(Boolean).map(b => ({ label: b, value: b })),
            categories: categories.filter(Boolean).map(c => ({ label: c, value: c }))
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
