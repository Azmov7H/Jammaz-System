'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  ArrowLeftRight,
  Search,
  TrendingUp,
  TrendingDown,
  Layers,
  History,
  Package,
  AlertCircle,
  Plus
} from 'lucide-react';
import { hasPermission } from '@/lib/permissions';import { useUserRole } from '@/hooks/useUserRole';
import { useStockMovements, useAddStockMovement, useTransferStock } from '@/hooks/useStock';
import { cn } from '@/utils';
import { StockMovementDialog } from '@/components/stock/StockMovementDialog';
import { MovementCard, MovementTypeBadge } from '@/components/stock/MovementCard';
import { MovementDetailsDialog } from '@/components/stock/MovementDetailsDialog';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { TableCell } from '@/components/ui/table';
import {
  CartesianGrid,
  Legend,
  Line as RechartsLine,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';

const StockActionCard = ({ title, description, icon: Icon, onClick, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "glass-card p-6 rounded-[2rem] border border-white/10 cursor-pointer overflow-hidden relative group",
      "hover:border-primary/50 transition-colors shadow-xl"
    )}
  >
    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity", color)} />
    <div className="flex items-start justify-between relative z-10">
      <div className="space-y-2">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground font-medium leading-tight max-w-[180px]">
          {description}
        </p>
      </div>
      <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/10 text-primary shadow-inner", color.replace('from-', 'text-'))}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-6 flex items-center text-xs font-bold text-primary gap-1 group-hover:translate-x-1 transition-transform">
      تنفيذ العملية <ArrowLeftRight size={12} className="rotate-90" />
    </div>
  </motion.div>
);


export default function StockPage() {
  const { role } = useUserRole();
  const canManage = hasPermission(role, 'stock:manage') || hasPermission(role, 'transfers:manage');

  const { data: movementsData, isLoading: loadingMovements } = useStockMovements();
  const movements = useMemo(() => {
    if (!movementsData) return [];
    if (Array.isArray(movementsData)) return movementsData;
    if (movementsData.data && Array.isArray(movementsData.data)) return movementsData.data;
    if (movementsData.movements && Array.isArray(movementsData.movements)) return movementsData.movements;
    return [];
  }, [movementsData]);

  const { mutate: addMovement, isPending: isAdding } = useAddStockMovement();
  const { mutate: transferStock, isPending: isTransferring } = useTransferStock();
  const isSubmitting = isAdding || isTransferring;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedMovement, setSelectedMovement] = useState(null);

  // Stats Logic
  const stats = useMemo(() => {
    return {
      total: movements.length,
      in: movements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.qty, 0),
      out: movements.filter(m => ['OUT', 'SALE'].includes(m.type)).reduce((acc, m) => acc + m.qty, 0),
      transfers: movements.filter(m => m.type.includes('TRANSFER') || m.type === 'REVERSAL').length
    };
  }, [movements]);

  // Chart Data Logic
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dataIn = last7Days.map(date => {
      return movements
        .filter(m => m.type === 'IN' && m.date.split('T')[0] === date)
        .reduce((sum, m) => sum + m.qty, 0);
    });

    const dataOut = last7Days.map(date => {
      return movements
        .filter(m => ['OUT', 'SALE'].includes(m.type) && m.date.split('T')[0] === date)
        .reduce((sum, m) => sum + m.qty, 0);
    });

    return last7Days.map((d, i) => ({
      date: new Date(d).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }),
      'وارد': dataIn[i],
      'صادر': dataOut[i],
    }));
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return movements;

    return movements.filter(m => {
      const productName = m.productId?.name?.toLowerCase() || '';
      const productCode = m.productId?.code?.toLowerCase() || '';
      const note = m.note?.toLowerCase() || '';


      const matchesSearch = productName.includes(term) ||
        productCode.includes(term) ||
        note.includes(term);

      const matchesType = filterType === 'ALL' || m.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [movements, searchQuery, filterType]);

  const handleSubmit = (payload, resetCallback) => {
    const mutation = payload?.type === 'TRANSFER_WAREHOUSE' ? transferStock : addMovement;
    mutation(payload, {
      onSuccess: () => {
        setIsDialogOpen(false);
        if (resetCallback) resetCallback();
      }
    });
  };

  return (
    <div className="min-h-screen bg-foreground/1020 space-y-8 p-4 md:p-8" dir="rtl">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
              <History className="w-8 h-8 text-primary animate-spin-slow" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent animate-gradient-x">
              لوحة تحكم المخزون
            </h1>
          </div>
          <p className="text-muted-foreground font-bold text-lg max-w-2xl leading-relaxed">
            مرحباً بك في مركز العمليات. هنا يمكنك مراقبة حركة الأصناف وتنفيذ التحويلات بين الفروع والمستودعات بدقة متناهية.
          </p>
        </motion.div>

        {/* Real-time Clock / Metadata */}
        <div className="hidden xl:flex items-center gap-6 glass-card px-8 py-4 rounded-[2rem] border border-white/10">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">آخر تحديث للمخزون</span>
            <span className="text-xl font-bold tabular-nums">{new Date().toLocaleTimeString('ar-EG')}</span>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-success uppercase tracking-[0.2em]">حالة النظام</span>
            <span className="text-xl font-bold">متصل ومؤمن</span>
          </div>
        </div>
      </div>

      {/* Action Center - Quick Commands */}
      {canManage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StockActionCard
            title="إضافة مخزون (وارد)"
            description="تسجيل بضاعة واصلة أو مشتريات جديدة يدوياً لزيادة الأرصدة."
            icon={TrendingUp}
            onClick={() => setIsDialogOpen(true)}
            color="from-success/20 to-success/5"
            delay={0.1}
          />
          <StockActionCard
            title="صرف مخزون (صادر)"
            description="تسجيل بضاعة منصرفة أو مبيعات يدوية لخصمها من الأرصدة."
            icon={TrendingDown}
            onClick={() => setIsDialogOpen(true)}
            color="from-destructive/20 to-destructive/5"
            delay={0.2}
          />
          <StockActionCard
            title="تحويل بين المواقع"
            description="نقل المخزون بين المحل والمخزن بشكل رسمي لتتبع المواقع."
            icon={ArrowLeftRight}
            onClick={() => setIsDialogOpen(true)}
            color="from-info/20 to-info/5"
            delay={0.3}
          />
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp className="text-primary" />
                اتجاهات الحركة (آخر 7 أيام)
              </h2>
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> وارد</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-destructive" /> صادر</div>
              </div>
            </div>
            <div className="h-[300px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="transparent" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <RechartsTooltip
                    contentStyle={{ direction: 'rtl', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <RechartsLine type="monotone" dataKey="وارد" stroke="#10b981" strokeWidth={2} dot={false} fill="rgba(16, 185, 129, 0.1)" />
                  <RechartsLine type="monotone" dataKey="صادر" stroke="#f43f5e" strokeWidth={2} dot={false} fill="rgba(244, 63, 94, 0.1)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-6">
          {[
            { label: 'إجمالي العمليات', value: stats.total, icon: Layers, color: 'text-info' },
            { label: 'إجمالي الوارد', value: stats.in, icon: TrendingUp, color: 'text-success' },
            { label: 'إجمالي الصادر', value: stats.out, icon: TrendingDown, color: 'text-destructive' },
            { label: 'التحويلات', value: stats.transfers, icon: ArrowLeftRight, color: 'text-warning' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + (i * 0.1) }}
              className="glass-card p-6 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-xl"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-bold tabular-nums">{stat.value}</h3>
              </div>
              <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/10", stat.color)}>
                <stat.icon size={24} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modern Search Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] relative group"
      >
        <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        <Search className="absolute right-10 top-1/2 -translate-y-1/2 text-primary h-6 w-6 group-focus-within:animate-pulse transition-all" />
        <Input
          placeholder="ابحث بعمق في قائمة الحركات والأصناف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-16 pr-16 pl-8 rounded-[2rem] bg-white/[0.03] border-white/5 focus:bg-white/[0.07] focus:border-primary/30 transition-all font-bold text-xl placeholder:text-muted-foreground/30 shadow-inner"
        />

        {/* Type Filter */}
        <div className="max-md:static max-md:mt-3 flex items-center gap-2 md:absolute md:left-4 md:top-1/2 md:-translate-y-1/2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-11 w-full pl-4 pr-10 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white focus:border-primary/50 hover:bg-black/60">
              <SelectValue placeholder="كل الحركات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الحركات</SelectItem>
              <SelectItem value="IN">وارد (شراء)</SelectItem>
              <SelectItem value="OUT">صادر (بيع/تالف)</SelectItem>
              <SelectItem value="TRANSFER_TO_SHOP">تحويل للمحل</SelectItem>
              <SelectItem value="TRANSFER_TO_WAREHOUSE">تحويل للمخزن</SelectItem>
              <SelectItem value="TRANSFER">تحويل بين المخازن</SelectItem>
              <SelectItem value="REVERSAL">تراجع عن تحويل</SelectItem>
              <SelectItem value="ADJUST">تسوية جردية</SelectItem>
            </SelectContent>
          </Select>
          <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
        </div>
      </motion.div>

      {/* Enhanced Movement Feed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.25)]"
      >
        <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <h2 className="text-2xl font-bold tracking-tight">سجل الحركات الأخير</h2>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30 font-bold px-4 py-1.5 rounded-full text-xs">
            {filteredMovements.length} حركة مطابقة
          </Badge>
        </div>

        <ResponsiveTable
          columns={[
            { label: 'المنتج والتفاصيل', headerClassName: 'text-right font-bold text-white/40 uppercase tracking-widest text-xs px-8' },
            { label: 'نوع الحركة', headerClassName: 'text-right font-bold text-white/40 uppercase tracking-widest text-xs px-8' },
            { label: 'الكمية', headerClassName: 'text-right font-bold text-white/40 uppercase tracking-widest text-xs px-8' },
            { label: 'التوقيت', headerClassName: 'text-right font-bold text-white/40 uppercase tracking-widest text-xs px-8' },
            { label: 'بواسطة', headerClassName: 'text-right font-bold text-white/40 uppercase tracking-widest text-xs px-8' }
          ]}
          data={filteredMovements.slice(0, 15)}
          isPending={loadingMovements}
          emptyTitle="لا توجد حركات مطابقة"
          tableLabel="سجل الحركات"
          renderDesktopRow={(m) => (
            <motion.tr
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedMovement(m)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedMovement(m);
                }
              }}
              aria-label={`عرض تفاصيل حركة ${m.productId?.name || ''}`}
              className="group hover:bg-white/[0.04] border-white/5 transition-all duration-300 h-20 cursor-pointer focus:outline-none focus:bg-white/[0.06]"
            >
              <TableCell className="px-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                    <Package className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg group-hover:text-primary transition-colors leading-tight">
                      {m.productId?.name || 'منتج غير معروف'}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground/50 tracking-widest uppercase">{m.productId?.code}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-8"><MovementTypeBadge type={m.type} /></TableCell>
              <TableCell className="px-8">
                <div className="text-2xl font-bold tabular-nums tracking-tighter">
                  {m.qty}
                </div>
              </TableCell>
              <TableCell className="px-8 font-bold text-muted-foreground/80">
                {new Date(m.date).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })} • {new Date(m.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </TableCell>
              <TableCell className="px-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-white/10 flex items-center justify-center text-xs font-bold">
                    {(m.createdBy?.name || 'A')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">
                    {m.createdBy?.name || 'غير معروف'}
                  </span>
                </div>
              </TableCell>
            </motion.tr>
          )}
          renderMobileCard={(m) => (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedMovement(m)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedMovement(m);
                }
              }}
              className="cursor-pointer focus:outline-none"
            >
              <MovementCard movement={m} />
            </div>
          )}
        />
      </motion.div>

      <StockMovementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <MovementDetailsDialog
        open={!!selectedMovement}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedMovement(null);
        }}
        movement={selectedMovement}
      />
    </div>
  );
}

