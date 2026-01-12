import { apiHandler } from '@/lib/api-handler';
import { ExportService } from '@/services/exportService';
import { UserService } from '@/services/userService';
import { ProductService } from '@/services/productService';
import { NextResponse } from 'next/server';

export const POST = apiHandler(async (req) => {
    const { type, format } = await req.json();

    let data = [];
    let columns = [];
    let filename = 'export';

    // 1. Fetch Data based on Type
    switch (type) {
        case 'users':
            data = await UserService.getAll({});
            columns = [
                { header: 'الاسم', key: 'name', width: 30 },
                { header: 'البريد الإلكتروني', key: 'email', width: 35 },
                { header: 'الصلاحية', key: 'role', width: 20 },
                { header: 'تاريخ التسجيل', key: 'createdAt', width: 20 }
            ];
            filename = 'users_report';
            break;

        case 'products':
            data = await ProductService.getAll({});
            // Flattener/Mapper might be needed if ProductService returns complex objects
            data = data.map(p => ({
                code: p.code,
                name: p.name,
                stockQty: p.stockQty,
                retailPrice: p.retailPrice || p.sellPrice,
                buyPrice: p.buyPrice
            }));
            columns = [
                { header: 'كود', key: 'code', width: 15 },
                { header: 'الاسم', key: 'name', width: 40 },
                { header: 'الكمية', key: 'stockQty', width: 15 },
                { header: 'سعر البيع', key: 'retailPrice', width: 15 },
                { header: 'سعر الشراء', key: 'buyPrice', width: 15 }
            ];
            filename = 'products_report';
            break;

        default:
            throw new Error('Invalid export type');
    }

    // 2. Generate Excel
    if (format === 'excel') {
        const buffer = await ExportService.generateExcel(data, columns, filename);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=${filename}.xlsx`
            }
        });
    }

    throw new Error('Unsupported format');
});
