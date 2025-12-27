'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { useUserRole } from '@/hooks/useUserRole';
import { useStockMovements, useAddStockMovement } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

export default function StockPage() {
  const { role } = useUserRole();
  const canManage = hasPermission(role, 'stock:manage') || hasPermission(role, 'transfers:manage');

  const { data: movements = [], isLoading: loadingMovements } = useStockMovements();
  const { data: productsData, isLoading: loadingProducts } = useProducts({ limit: 100 });
  const products = productsData || [];

  const { mutate: addMovement, isPending: isSubmitting } = useAddStockMovement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '', type: 'IN', qty: '', note: ''
  });

  const loading = loadingMovements || loadingProducts;

  const handleSubmit = (e) => {
    e.preventDefault();
    addMovement(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ productId: '', type: 'IN', qty: '', note: '' });
      }
    });
  };

  const getTypeBadge = (type) => {
    const variants = {
      'IN': { variant: "default", label: 'إدخال (شراء)', className: "bg-green-600" },
      'OUT': { variant: "destructive", label: 'إخراج' },
      'TRANSFER_TO_SHOP': { variant: "secondary", label: 'تحويل للمحل' },
      'TRANSFER_TO_WAREHOUSE': { variant: "outline", label: 'إرجاع للمخزن' },
      'ADJUST': { variant: "outline", label: 'تسوية جردية', className: "bg-purple-100 text-purple-800 border-purple-300" },
    };

    const config = variants[type] || variants['IN'];
    return (
      <Badge variant={config.variant} className={cn("whitespace-nowrap", config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-startmd:items-center gap-4">
        <div className="animate-slide-in-right">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">حركة المخزون</h1>
          <p className="text-sm text-muted-foreground">سجل عمليات الإدخال والإخراج</p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary border-0 hover-lift shadow-colored animate-scale-in">
                <ArrowLeftRight size={18} />
                حركة يدوية
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>تسجيل حركة مخزون</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>المنتج</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.productId}
                    onChange={e => setFormData({ ...formData, productId: e.target.value })}
                    required
                  >
                    <option value="">اختر المنتج...</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} (مخزن: {p.warehouseQty || 0} | محل: {p.shopQty || 0})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>العملية</Label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="IN">شراء / توريد (للمخزن)</option>
                      <option value="OUT">صرف / تالف (من المخزن)</option>
                      <option value="TRANSFER_TO_SHOP">تحويل للمحل (عرض)</option>
                      <option value="TRANSFER_TO_WAREHOUSE">إرجاع للمخزن (تخزين)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      required
                      min="1"
                      value={formData.qty}
                      onChange={e => setFormData({ ...formData, qty: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={!formData.productId || !formData.qty || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'تسجيل الحركة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Movements Table */}
      <div className="glass-card rounded-lg border shadow-custom-md overflow-x-auto hover-lift transition-all duration-300">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">المنتج</TableHead>
              <TableHead className="text-right">نوع الحركة</TableHead>
              <TableHead className="text-right">الكمية</TableHead>
              <TableHead className="text-right hidden md:table-cell">الملاحظات</TableHead>
              <TableHead className="text-right hidden lg:table-cell">المستخدم</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  لا توجد حركات مسجلة
                </TableCell>
              </TableRow>
            ) : (
              movements.map(m => (
                <TableRow key={m._id} className="transition-all duration-300 hover:bg-muted/50 cursor-pointer group">
                  <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {new Date(m.date).toLocaleString('ar-SA')}
                  </TableCell>
                  <TableCell className="font-medium">{m.productId?.name}</TableCell>
                  <TableCell>{getTypeBadge(m.type)}</TableCell>
                  <TableCell className="font-bold">{m.qty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {m.note || '-'}
                  </TableCell>
                  <TableCell className="text-xs hidden lg:table-cell">
                    {m.createdBy?.name || 'النظام'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
