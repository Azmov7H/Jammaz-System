import { apiHandler } from '@/lib/api-handler';
import { SupplierService } from '@/services/supplierService';

/**
 * GET single supplier by ID
 */
export const GET = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const supplier = await SupplierService.getById(id);
    return { supplier };
});

/**
 * UPDATE supplier
 */
export const PUT = apiHandler(async (req, { params }) => {
    const { id } = await params;
    const body = await req.json();
    const updated = await SupplierService.update(id, body);
    return { supplier: updated };
}, { auth: true });

/**
 * DELETE supplier
 */
export const DELETE = apiHandler(async (req, { params }) => {
    const { id } = await params;
    await SupplierService.delete(id);
    return { message: 'تم حذف المورد بنجاح' };
}, { auth: true });
