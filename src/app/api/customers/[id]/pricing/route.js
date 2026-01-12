import { apiHandler } from '@/lib/api-handler';
import dbConnect from '@/lib/db';
import { PricingService } from '@/services/pricingService';

// GET all custom prices for a customer
export const GET = apiHandler(async (request, { params }) => {
    await dbConnect();
    const { id } = await params;
    const prices = await PricingService.getCustomerPricing(id);
    return { prices };
});

// POST set a custom price
export const POST = apiHandler(async (request, { params }) => {
    await dbConnect();
    const { id } = await params;
    const { productId, price } = await request.json();
    const customer = await PricingService.setCustomPrice(id, productId, price);
    return { customer };
});

// DELETE remove a custom price
export const DELETE = apiHandler(async (request, { params }) => {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) throw new Error('Product ID required');

    const customer = await PricingService.removeCustomPrice(id, productId);
    return { customer };
});
