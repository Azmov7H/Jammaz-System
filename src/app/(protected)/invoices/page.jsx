'use client';

import { useInvoicesPageManager } from '@/hooks/useInvoices';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';
import { LABELS } from '@/constants';
import { LoadingState, PageLoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { KPICard } from '@/components/dashboard/KPICard';
import { InvoiceListItem } from '@/components/invoices/InvoiceListItem';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis
} from '@/components/ui/pagination';
import { PageHeader } from '@/components/ui/PageHeader';
import { Loader2, RefreshCw } from 'lucide-react';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Receipt,
    Plus,
    Search,
    ShoppingBag,
    TrendingUp,
    FileText,
    Banknote,
    CreditCard
} from 'lucide-react';

export default function InvoicesPage() {
    const {
        title,
        subtitle,
        newInvoice,
        searchPlaceholder,
        loading: loadingLabel,
        noInvoices,
        noMatchingInvoices,
        totalSales: totalSalesLabel,
        invoiceCount: invoiceCountLabel,
        cashCollection: cashCollectionLabel,
        creditSales: creditSalesLabel,
        filterAll,
        filterCash,
        filterCredit
    } = LABELS.invoices;

    const {
        searchTerm,
        filterType, setFilterType,
        handleSearch,
        handleDelete,
        filteredInvoices,
        isLoading,
        isError,
        refetch,
        stats,
        page,
        setPage,
        pagination
    } = useInvoicesPageManager();

    const { totalSales, invoicesCount, cashInvoices, creditInvoices } = stats;
    const { pages: totalPages } = pagination;

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Header Section */}
            <PageHeader
                title="أرشيف الفواتير"
                subtitle="إستعراض وتتبع كافة المعاملات المالية والمبيعات"
                icon={Receipt}
                actions={
                    <>
                        <div className="hidden xl:flex items-center gap-6 glass-card px-8 py-4 rounded-3xl border border-white/10 shadow-xl ml-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">إجمالي المبيعات</span>
                                <span className="text-xl font-bold tabular-nums text-emerald-500">{(totalSales || 0).toLocaleString()} ج.م</span>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">عدد الفواتير</span>
                                <span className="text-xl font-bold tabular-nums">{invoicesCount}</span>
                            </div>
                        </div>

                        <Link href="/invoices/new" className="flex-1 lg:flex-none">
                            <Button className="h-14 px-8 rounded-2xl font-black text-lg gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 w-full lg:w-auto bg-primary text-primary-foreground">
                                <Plus size={24} />
                                فاتورة جديدة
                            </Button>
                        </Link>
                    </>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title={totalSalesLabel}
                    value={totalSales.toLocaleString()}
                    unit={` ${LABELS.common.currency}`}
                    icon={TrendingUp}
                    variant="primary"
                />
                <KPICard
                    title={invoiceCountLabel}
                    value={invoicesCount}
                    unit={` ${LABELS.pagination.invoice}`}
                    icon={FileText}
                    variant="secondary"
                />
                <KPICard
                    title={cashCollectionLabel}
                    value={cashInvoices}
                    unit={` ${LABELS.pagination.invoice}`}
                    icon={Banknote}
                    variant="success"
                />
                <KPICard
                    title={creditSalesLabel}
                    value={creditInvoices}
                    unit={` ${LABELS.pagination.invoice}`}
                    icon={CreditCard}
                    variant="warning"
                />
            </div>

            {/* Control Bar */}
            <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between sticky top-[72px] z-50">
                <div className="relative group flex-1">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-6 w-6 group-focus-within:animate-pulse transition-all" />
                    <Input
                        placeholder="ابحث برقم الفاتورة، اسم العميل، أو التاريخ..."
                        className="h-16 pr-16 pl-8 rounded-[2rem] bg-card/40 border-white/10 focus:bg-card/60 focus:border-primary/50 transition-all font-black text-xl placeholder:text-muted-foreground/30 shadow-2xl backdrop-blur-xl ring-0 focus-visible:ring-0"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                <div className="flex p-2 bg-black/20 backdrop-blur-md rounded-[2rem] border border-white/5 shadow-inner">
                    {[
                        { id: 'all', label: filterAll, icon: ShoppingBag },
                        { id: 'cash', label: filterCash, icon: Banknote },
                        { id: 'credit', label: filterCredit, icon: CreditCard }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setFilterType(tab.id)}
                                className={cn(
                                    "px-8 py-3 rounded-2xl font-black transition-all text-sm whitespace-nowrap flex items-center gap-3",
                                    filterType === tab.id
                                        ? "bg-primary text-primary-foreground shadow-xl scale-105"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Invoices List Content */}
            {isLoading ? (
                <div className="py-20 bg-card/10 rounded-[2.5rem] border border-white/5 shadow-inner">
                    <LoadingState message={loadingLabel} size="lg" />
                </div>
            ) : isError ? (
                <div className="py-20 bg-card/10 rounded-[2.5rem] border border-white/5 shadow-inner">
                    <ErrorState onRetry={refetch} />
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6 bg-card/10 rounded-[2.5rem] border border-dashed border-white/10 shadow-inner group">
                    <div className="p-8 bg-white/5 rounded-[2.5rem] group-hover:scale-110 transition-transform">
                        <ShoppingBag className="h-20 w-20 text-muted-foreground/20" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-3xl font-black text-white/30">{noInvoices}</h3>
                        <p className="text-white/10 font-bold uppercase tracking-widest">{noMatchingInvoices}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-8 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                            <span className="text-sm font-black text-white/40 uppercase tracking-widest">تحديثات المبيعات الحالية</span>
                        </div>
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-tighter">
                            {pagination.total} عملية مسجلة
                        </Badge>
                    </div>

                    <div className="grid gap-4">
                        {filteredInvoices.map((inv) => (
                            <InvoiceListItem
                                key={inv._id}
                                invoice={inv}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {/* Elegant Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center pt-12" dir="ltr">
                            <div className="glass-card px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                                <Pagination>
                                    <PaginationContent className="gap-2">
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => setPage(Math.max(1, page - 1))}
                                                className={cn(
                                                    "h-10 px-4 rounded-xl border-white/5 hover:bg-white/5 transition-all text-sm font-black",
                                                    page === 1 ? 'pointer-events-none opacity-25' : 'cursor-pointer'
                                                )}
                                            />
                                        </PaginationItem>

                                        {page > 3 && (
                                            <>
                                                <PaginationItem>
                                                    <PaginationLink onClick={() => setPage(1)} className="h-10 w-10 rounded-xl cursor-pointer font-black border-white/5 text-muted-foreground">
                                                        1
                                                    </PaginationLink>
                                                </PaginationItem>
                                                <PaginationEllipsis className="text-white/10" />
                                            </>
                                        )}

                                        {getPageNumbers().map((p) => (
                                            <PaginationItem key={p}>
                                                <PaginationLink
                                                    onClick={() => setPage(p)}
                                                    isActive={p === page}
                                                    className={cn(
                                                        "h-10 w-10 rounded-xl cursor-pointer font-black transition-all",
                                                        p === page
                                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                            : "border-white/5 hover:bg-white/5 text-muted-foreground"
                                                    )}
                                                >
                                                    {p}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        {page < totalPages - 2 && (
                                            <>
                                                <PaginationEllipsis className="text-white/10" />
                                                <PaginationItem>
                                                    <PaginationLink onClick={() => setPage(totalPages)} className="h-10 w-10 rounded-xl cursor-pointer font-black border-white/5 text-muted-foreground">
                                                        {totalPages}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            </>
                                        )}

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                                className={cn(
                                                    "h-10 px-4 rounded-xl border-white/5 hover:bg-white/5 transition-all text-sm font-black",
                                                    page === totalPages ? 'pointer-events-none opacity-25' : 'cursor-pointer'
                                                )}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
