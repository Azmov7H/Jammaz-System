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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
        <h3 className="text-xl font-black">{title}</h3>
        <p className="text-sm text-muted-foreground font-medium leading-tight max-w-[180px]">
          {description}
        </p>
      </div>
      <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/10 text-primary shadow-inner", color.replace('from-', 'text-'))}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-6 flex items-center text-xs font-black text-primary gap-1 group-hover:translate-x-1 transition-transform">
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

  const { mutate: addMovement, isPending: isSubmitting } = useAddStockMovement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Stats Logic
  const stats = useMemo(() => {
    return {
      total: movements.length,
      in: movements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.qty, 0),
      out: movements.filter(m => ['OUT', 'SALE'].includes(m.type)).reduce((acc, m) => acc + m.qty, 0),
      transfers: movements.filter(m => m.type.includes('TRANSFER')).length
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

    return {
      labels: last7Days.map(d => new Date(d).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'وارد',
          data: dataIn,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'صادر',
          data: dataOut,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
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
    <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8" dir="rtl">
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
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent animate-gradient-x">
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
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">آخر تحديث للمخزون</span>
            <span className="text-xl font-bold tabular-nums">{new Date().toLocaleTimeString('ar-EG')}</span>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">حالة النظام</span>
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
            color="from-emerald-500/20 to-emerald-600/5"
            delay={0.1}
          />
          <StockActionCard
            title="صرف مخزون (صادر)"
            description="تسجيل بضاعة منصرفة أو مبيعات يدوية لخصمها من الأرصدة."
            icon={TrendingDown}
            onClick={() => setIsDialogOpen(true)}
            color="from-rose-500/20 to-rose-600/5"
            delay={0.2}
          />
          <StockActionCard
            title="تحويل بين المواقع"
            description="نقل المخزون بين المحل والمخزن بشكل رسمي لتتبع المواقع."
            icon={ArrowLeftRight}
            onClick={() => setIsDialogOpen(true)}
            color="from-blue-500/20 to-blue-600/5"
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
              <h2 className="text-2xl font-black flex items-center gap-3">
                <TrendingUp className="text-primary" />
                اتجاهات الحركة (آخر 7 أيام)
              </h2>
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> وارد</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" /> صادر</div>
              </div>
            </div>
            <div className="h-[300px]">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { grid: { display: false }, ticks: { font: { weight: 'bold' } } },
                    x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
                  },
                  plugins: { legend: { display: false } }
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-6">
          {[
            { label: 'إجمالي العمليات', value: stats.total, icon: Layers, color: 'text-blue-400' },
            { label: 'إجمالي الوارد', value: stats.in, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'إجمالي الصادر', value: stats.out, icon: TrendingDown, color: 'text-rose-400' },
            { label: 'التحويلات', value: stats.transfers, icon: ArrowLeftRight, color: 'text-amber-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + (i * 0.1) }}
              className="glass-card p-6 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-xl"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black tabular-nums">{stat.value}</h3>
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
          className="h-16 pr-16 pl-8 rounded-[2rem] bg-white/[0.03] border-white/5 focus:bg-white/[0.07] focus:border-primary/30 transition-all font-black text-xl placeholder:text-muted-foreground/30 shadow-inner ring-0 focus-visible:ring-0"
        />

        {/* Type Filter */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 pl-4 pr-10 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white focus:border-primary/50 outline-none appearance-none cursor-pointer hover:bg-black/60 transition-colors"
            style={{ backgroundImage: 'none' }}
          >
            <option value="ALL">كل الحركات</option>
            <option value="IN">وارد (شراء)</option>
            <option value="OUT">صادر (بيع/تالف)</option>
            <option value="TRANSFER_TO_SHOP">تحويل للمحل</option>
            <option value="TRANSFER_TO_WAREHOUSE">تحويل للمخزن</option>
            <option value="ADJUST">تسوية جردية</option>
          </select>
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
                      <p className="text-2xl font-black text-white/30">جاري تحميل البيانات...</p>
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
                        <Package size={64} className="text-muted-foreground/20" />
                      </div>
                      <p className="text-2xl font-black text-white/30">لا توجد حركات مطابقة</p>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.slice(0, 15).map((m, i) => (
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
                          <span className="text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase">{m.productId?.code}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">{getTypeBadge(m.type)}</TableCell>
                    <TableCell className="px-8">
                      <div className="text-2xl font-black tabular-nums tracking-tighter">
                        {m.qty}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 font-bold text-muted-foreground/80">
                      {new Date(m.date).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })} • {new Date(m.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-white/10 flex items-center justify-center text-[10px] font-black">
                          {(m.createdBy?.name || 'A')[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-black text-muted-foreground">
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

