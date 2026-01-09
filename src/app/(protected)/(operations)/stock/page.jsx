'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { useUserRole } from '@/hooks/useUserRole';
import { useStockMovements, useAddStockMovement } from '@/hooks/useStock';
import { cn } from '@/lib/utils';
import { StockMovementDialog } from '@/components/stock/StockMovementDialog';

export default function StockPage() {
  const { role } = useUserRole();
  const canManage = hasPermission(role, 'stock:manage') || hasPermission(role, 'transfers:manage');

  const { data: movementsData, isLoading: loadingMovements } = useStockMovements();
  const movements = movementsData || [];
  const { mutate: addMovement, isPending: isSubmitting } = useAddStockMovement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (payload, resetCallback) => {
    addMovement(payload, {
      onSuccess: () => {
        setIsDialogOpen(false);
        if (resetCallback) resetCallback();
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="animate-slide-in-right">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">حركة المخزون</h1>
          <p className="text-sm text-muted-foreground">سجل عمليات الإدخال والإخراج</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 gradient-primary border-0 hover-lift shadow-colored animate-scale-in"
          >
            <ArrowLeftRight size={18} />
            حركة يدوية
          </Button>
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
            {loadingMovements ? (
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

      <StockMovementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
