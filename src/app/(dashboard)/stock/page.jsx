'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Loader2, Plus, Trash2, X, Package } from 'lucide-react';
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
  const [items, setItems] = useState([]); // For bulk movements

  const loading = loadingMovements || loadingProducts;

  const handleSubmit = (e) => {
    e.preventDefault();

    // If we have bulk items, use them, otherwise use the single product form
    const payload = items.length > 0
      ? { items, type: formData.type, note: formData.note }
      : formData;

    addMovement(payload, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ productId: '', type: 'IN', qty: '', note: '' });
        setItems([]);
      }
    });
  };

  const addItem = () => {
    if (!formData.productId || !formData.qty) return;
    const product = products.find(p => p._id === formData.productId);
    if (!product) return;

    setItems([...items, {
      productId: product._id,
      name: product.name,
      qty: Number(formData.qty),
      note: formData.note
    }]);

    // Reset product selection but keep type and global note
    setFormData({ ...formData, productId: '', qty: '' });
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
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
            <DialogContent dir="rtl" className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                  تسجيل حركة مخزون متعددة
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                {/* Global Settings */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">نوع العملية الموحد</Label>
                    <select
                      className="w-full p-2.5 border rounded-lg bg-background shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="IN">شراء / توريد (للمخزن)</option>
                      <option value="OUT">صرف / تالف (من المخزن)</option>
                      <option value="TRANSFER_TO_SHOP">تحويل للمحل (عرض)</option>
                      <option value="TRANSFER_TO_WAREHOUSE">إرجاع للمخزن (تخزين)</option>
                    </select>
                  </div>
                </div>

                {/* Product Selector */}
                <div className="space-y-3 border p-4 rounded-lg bg-card shadow-sm">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">إضافة منتج للقائمة</Label>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-7">
                      <select
                        className="w-full p-2.5 border rounded-lg bg-background text-sm"
                        value={formData.productId}
                        onChange={e => setFormData({ ...formData, productId: e.target.value })}
                      >
                        <option value="">اختر المنتج...</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.name} (مخزن: {p.warehouseQty || 0} | محل: {p.shopQty || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        type="number"
                        placeholder="الكمية"
                        min="1"
                        value={formData.qty}
                        onChange={e => setFormData({ ...formData, qty: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full h-10 gap-1"
                        onClick={addItem}
                        disabled={!formData.productId || !formData.qty}
                      >
                        <Plus size={16} />
                        أضف
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">المنتجات المختارة ({items.length})</Label>
                    <div className="border rounded-lg overflow-hidden divide-y bg-muted/10">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background hover:bg-muted/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                              <Package size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-bold leading-none">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">الكمية: {item.qty} قطعة</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">ملاحظات عامة (اختياري)</Label>
                  <Input
                    placeholder="سبب الحركة، رقم الإذن..."
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    className="h-10"
                  />
                </div>

                <DialogFooter className="pt-4 border-t gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    className="gradient-primary border-0 min-w-[140px]"
                    disabled={(items.length === 0 && (!formData.productId || !formData.qty)) || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>تأكيد نقل {items.length > 0 ? items.length : 'المنتج'}</>
                    )}
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
