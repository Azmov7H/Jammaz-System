import { apiHandler } from '@/lib/api-handler';
import SalesReturn from '@/models/SalesReturn';

export const GET = apiHandler(async (request, { params }) => {
    const { id } = await params;

    const returns = await SalesReturn.find({ originalInvoice: id })
        .sort({ createdAt: -1 })
        .populate('items.productId', 'name')
        .populate('createdBy', 'name')
        .lean();

    return {
        returns
    };
});
