import { Loader2 } from 'lucide-react';

export function LowStockTable({ products }) {
    if (!products || products.length === 0) return null;

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-muted/50 border-b">
                    <tr>
                        <th className="px-4 py-3 text-right text-sm font-semibold">المنتج</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">المحل</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">المخزن</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">الإجمالي</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">الحد الأدنى</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {products.map((product) => (
                        <tr key={product._id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                                <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center">{product.shopQty}</td>
                            <td className="px-4 py-3 text-center">{product.warehouseQty}</td>
                            <td className="px-4 py-3 text-center font-bold text-destructive">{product.stockQty}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{product.minLevel}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
