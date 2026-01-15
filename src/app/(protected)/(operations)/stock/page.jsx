'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeftRight,
  Loader2,
  Search,
  TrendingUp,
  TrendingDown,
  Layers,
  History,
  Package,
  AlertCircle,
  Plus
} from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { useUserRole } from '@/hooks/useUserRole';
import { useStockMovements, useAddStockMovement } from '@/hooks/useStock';
import { cn } from '@/utils';
import { StockMovementDialog } from '@/components/stock/StockMovementDialog';

export default function StockPage() {
  const { role } = useUserRole();
  const canManage = hasPermission(role, 'stock:manage') || hasPermission(role, 'transfers:manage');

  const { data: movementsData, isLoading: loadingMovements } = useStockMovements();
  const movements = useMemo(() => {
    if (!movementsData) return [];
    if (Array.isArray(movementsData)) return movementsData;
    if (movementsData.movements && Array.isArray(movementsData.movements)) return movementsData.movements;
    return [];
  }, [movementsData]);

  const { mutate: addMovement, isPending: isSubmitting } = useAddStockMovement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats Logic
  const stats = useMemo(() => {
    return {
      total: movements.length,
      in: movements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.qty, 0),
      out: movements.filter(m => ['OUT', 'SALE'].includes(m.type)).reduce((acc, m) => acc + m.qty, 0),
      transfers: movements.filter(m => m.type.includes('TRANSFER')).length
    };
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return movements;

    return movements.filter(m => {
      const productName = m.productId?.name?.toLowerCase() || '';
      const productCode = m.productId?.code?.toLowerCase() || '';
      const note = m.note?.toLowerCase() || '';

      return productName.includes(term) ||
        productCode.includes(term) ||
        note.includes(term);
    });
  }, [movements, searchQuery]);

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
      'IN': { variant: "default", label: 'إدخال (شراء)', className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: TrendingUp },
      'OUT': { variant: "destructive", label: 'إخراج', className: "bg-red-500/10 text-red-500 border-red-500/20", icon: TrendingDown },
      'TRANSFER_TO_SHOP': { variant: "secondary", label: 'تحويل للمحل', className: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: ArrowLeftRight },
      'TRANSFER_TO_WAREHOUSE': { variant: "outline", label: 'إرجاع للمخزن', className: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: ArrowLeftRight },
      'ADJUST': { variant: "outline", label: 'تسوية جردية', className: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Layers },
    };

    const config = variants[type] || { variant: "default", label: type, className: "bg-slate-500/10 text-slate-500", icon: Package };
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn("gap-1.5 py-1 px-3 font-bold", config.className)}>
        <Icon size={12} />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-1 md:p-6" dir="rtl">
      {/* Header & Stats Overview */}
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4">
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent animate-gradient-x">حركة المخزون</span>
              <div className="p-2 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                <History className="w-8 h-8 text-primary animate-spin-slow" />
              </div>
            </h1>
            <p className="text-muted-foreground mt-3 font-bold text-lg max-w-lg leading-relaxed">
              تتبع وإدارة تدفق المنتجات بين المستودعات والمحلات بدقة فائقة وتصميم عصري.
            </p>
          </motion.div>

          {canManage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="gradient-primary border-0 h-16 px-10 rounded-3xl font-black text-xl shadow-[0_20px_40px_rgba(var(--primary),0.3)] hover-lift flex items-center gap-3 relative overflow-hidden group"
              >
                <Plus className="w-6 h-6 animate-bounce" />
                <span>تسجيل حركة يدوية</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
              </Button>
            </motion.div>
          )}
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'إجمالي العمليات', value: stats.total, icon: Layers, color: 'from-blue-500/20 to-blue-600/5', textColor: 'text-blue-400', glow: 'shadow-blue-500/10' },
            { label: 'إجمالي الوارد', value: stats.in, icon: TrendingUp, color: 'from-emerald-500/20 to-emerald-600/5', textColor: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
            { label: 'إجمالي الصادر', value: stats.out, icon: TrendingDown, color: 'from-rose-500/20 to-rose-600/5', textColor: 'text-rose-400', glow: 'shadow-rose-500/10' },
            { label: 'التحويلات الداخلية', value: stats.transfers, icon: ArrowLeftRight, color: 'from-amber-500/20 to-amber-600/5', textColor: 'text-amber-400', glow: 'shadow-amber-500/10' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={cn(
                "glass-card p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl",
                stat.glow
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-60 transition-opacity duration-500", stat.color)} />
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-inner", stat.textColor)}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                    {stat.label}
                  </p>
                  <h3 className="text-4xl font-black mt-1 tabular-nums tracking-tighter">
                    {stat.value}
                  </h3>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12">
                <stat.icon size={120} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Global Search Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] relative group"
      >
        <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        <Search className="absolute right-10 top-1/2 -translate-y-1/2 text-primary h-6 w-6 group-focus-within:animate-pulse transition-all" />
        <Input
          placeholder="ابحث بعمق في قائمة الحركات (اسم المنتج، الكود، التفاصيل)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-16 pr-16 pl-8 rounded-[2rem] bg-white/[0.03] border-white/5 focus:bg-white/[0.07] focus:border-primary/30 transition-all font-black text-xl placeholder:text-muted-foreground/30 shadow-inner"
        />
      </motion.div>

      {/* Movements Table Dashboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.25)]"
      >
        <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <h2 className="text-2xl font-black tracking-tight">سجل الحركات الأخير</h2>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30 font-black px-4 py-1.5 rounded-full text-xs">
            {filteredMovements.length} حركة مطابقة
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/5 h-16 bg-white/[0.01]">
              <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">المنتج والتفاصيل</TableHead>
              <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">نوع الحركة</TableHead>
              <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">الكمية</TableHead>
              <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">التوقيت</TableHead>
              <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">بواسطة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {loadingMovements ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                        <Loader2 size={64} className="text-primary animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-white/30">جاري تحميل سجل الحركات...</p>
                        <p className="text-sm text-muted-foreground/40 font-bold">يرجى الانتظار قليلاً</p>
                      </div>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                        <AlertCircle size={64} className="text-muted-foreground/20 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-white/30">لا توجد حركات مخزون مسجلة</p>
                        <p className="text-sm text-muted-foreground/40 font-bold">حاول تغيير معايير البحث أو تسجيل حركة جديدة</p>
                      </div>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((m, i) => (
                  <motion.tr
                    key={m._id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-white/[0.04] border-white/5 transition-all duration-300 h-20"
                  >
                    <TableCell className="px-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                          <Package className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-lg group-hover:text-primary transition-colors leading-tight">
                            {m.productId?.name || 'منتج غير معروف'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase">{m.productId?.code}</span>
                            {m.note && (
                              <span className="text-[10px] text-primary/40 font-black bg-primary/5 px-2 py-0.5 rounded-md italic truncate max-w-[150px]">
                                {m.note}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">{getTypeBadge(m.type)}</TableCell>
                    <TableCell className="px-8">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-black tabular-nums tracking-tighter">
                          {m.qty}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/40 mt-1 uppercase">Unit</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white/80 tabular-nums">
                          {new Date(m.date).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest tabular-nums">
                          {new Date(m.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-white/10 flex items-center justify-center text-[10px] font-black shadow-inner">
                          {(m.createdBy?.name || 'A')[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-black text-muted-foreground group-hover:text-foreground transition-colors">
                          {m.createdBy?.name || 'غير معروف'}
                        </span>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>

      <StockMovementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
