import { apiHandler } from '@/lib/api-handler';
import SalesReturn from '@/models/SalesReturn';

export const GET = apiHandler(async (request) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
        SalesReturn.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('originalInvoice', 'number date total')
            .populate('items.productId', 'name')
            .populate('createdBy', 'name')
            .lean(),
        SalesReturn.countDocuments()
    ]);

    return {
        returns,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
}, { auth: true });
