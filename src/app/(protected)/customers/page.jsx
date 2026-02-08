'use client';

import * as React from 'react';
import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useDebtOverview, useDebts, useReceivables } from '@/hooks/useFinancial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Users, Activity, RefreshCcw } from 'lucide-react';
import { cn } from '@/utils';
import { LABELS } from '@/constants';
import { LoadingState, TableLoadingState } from '@/components/common/LoadingState';
import { ErrorState, TableErrorState } from '@/components/common/ErrorState';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { PaymentDialog } from '@/components/financial/PaymentDialog';
import { InvoicePaymentDialog } from '@/components/financial/InvoicePaymentDialog';
import { InstallmentDialog } from '@/components/financial/InstallmentDialog';
import { UnifiedPaymentDialog } from '@/components/financial/UnifiedPaymentDialog';
import { CustomerDetailsSheet } from '@/components/customers/CustomerDetailsSheet';
import { CustomerRow } from '@/components/customers/CustomerRow';
import { DebtOverviewCards, CustomerStatsCards } from '@/components/customers/CustomerStats';
import { PartnerTransactionDialog } from '@/components/financial/PartnerTransactionDialog';
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

export default function CustomersPage() {
    const router = useRouter();

    // Data Fetching & Filter State
    const {
        data: queryData,
        isLoading,
        addMutation,
        updateMutation,
        deleteMutation,
        refetch,
        search,
        handleSearch,
        page,
        setPage
    } = useCustomers();

    const customers = queryData?.customers || [];
    const pagination = queryData?.pagination || { total: 0, pages: 1, page: 1, limit: 15 };
    const totalPages = pagination.pages;

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [detailCustomer, setDetailCustomer] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isInvoicePaymentOpen, setIsInvoicePaymentOpen] = useState(false);
    const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
    const [isUnifiedOpen, setIsUnifiedOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [unifiedPaymentData, setUnifiedPaymentData] = useState(null);

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

    // Financial Data
    const { data: debtOverview, isLoading: isDebtLoading } = useDebtOverview();
    const { data: debtsData } = useDebts({ debtorType: 'Customer' });
    const customerDebts = debtsData?.debts || [];
    const { data: collectionData } = useReceivables();
    const collectionInvoices = collectionData?.invoices || [];
    const totalReceivables = collectionData?.totalReceivables || 0;
    const pendingInvoicesCount = collectionData?.count || 0;

    // Handlers
    const handleRowClick = (customer) => {
        setDetailCustomer(customer);
        setIsDetailsOpen(true);
    };

    const handleRecordPayment = (debt) => {
        setSelectedDebt(debt);
        setIsPaymentOpen(true);
    };

    const handleScheduleInstallment = (debt) => {
        setSelectedDebt(debt);
        setIsInstallmentOpen(true);
    };

    const handleEditClick = (customer) => {
        setSelectedCustomer(customer);
        setIsEditOpen(true);
    };

    const handleFormSubmit = (formData) => {
        if (addMutation.isPending || updateMutation.isPending) {
            toast.warning('جاري معالجة الطلب، يرجى الانتظار...');
            return;
        }

        const payload = {
            ...formData,
            creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0
        };

        if (selectedCustomer) {
            updateMutation.mutate({ id: selectedCustomer._id, data: payload }, {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedCustomer(null);
                }
            });
        } else {
            addMutation.mutate(payload, {
                onSuccess: () => setIsAddOpen(false)
            });
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleUnifiedCollection = (customer, balance) => {
        if (!customer) return;
        setUnifiedPaymentData({
            id: customer._id,
            name: customer.name,
            balance: balance
        });
        setIsUnifiedOpen(true);
    };

    const {
        title,
        subtitle,
        addCustomer,
        searchPlaceholder,
        loading: loadingLabel,
        noCustomers,
        tableCustomer,
        tableContact,
        tablePriceType,
        tableDebt,
        tableActions,
        financialOverview
    } = LABELS.customers;

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Header Section */}
            <PageHeader
                title="إدارة العملاء"
                subtitle="قاعدة بيانات العملاء، الائتمان وسجل التحصيلات"
                icon={Users}
                actions={
                    <>
                        <div className="hidden xl:flex items-center gap-6 glass-card px-8 py-4 rounded-3xl border border-white/10 shadow-xl ml-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">إجمالي العملاء</span>
                                <span className="text-xl font-bold tabular-nums">{(pagination.total || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex flex-col items-end text-rose-500">
                                <span className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">إجمالي المديونيات</span>
                                <span className="text-xl font-bold tabular-nums">{(totalReceivables || 0).toLocaleString()} ج.م</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-1 lg:flex-none">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-14 h-14 rounded-2xl glass-card border-white/10 hover:border-primary/50 transition-all shadow-lg"
                                onClick={() => refetch()}
                            >
                                <RefreshCcw className="w-6 h-6 text-muted-foreground group-hover:rotate-180 transition-transform duration-700" />
                            </Button>
                            <Button
                                onClick={() => { setSelectedCustomer(null); setIsAddOpen(true); }}
                                className="h-14 px-8 rounded-2xl font-black text-lg gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex-1 lg:flex-none bg-primary text-primary-foreground"
                            >
                                <Plus size={24} />
                                إضافة عميل
                            </Button>
                        </div>
                    </>
                }
            />

            {/* Stats Overview */}
            {!isLoading && (
                <CustomerStatsCards
                    totalCustomers={queryData?.total || 0}
                    wholesaleCount={customers.filter(c => c.priceType === 'wholesale').length}
                    retailCount={customers.filter(c => c.priceType === 'retail').length}
                    activeBalanceCount={customers.filter(c => c.balance > 0).length}
                />
            )}

            {/* Financial Overview Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-2 h-6 bg-primary rounded-full" />
                    <h2 className="text-2xl font-black tracking-tight">{financialOverview}</h2>
                </div>
                <DebtOverviewCards
                    totalReceivables={totalReceivables}
                    pendingInvoicesCount={pendingInvoicesCount}
                    debtsCount={customerDebts.length}
                    totalOverdue={debtOverview?.receivables?.overdue || 0}
                />
            </div>

            {/* Control Bar */}
            <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between">
                <div className="relative group flex-1">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-6 w-6 group-focus-within:animate-pulse transition-all" />
                    <Input
                        placeholder={searchPlaceholder}
                        className="h-16 pr-16 pl-8 rounded-[2rem] bg-card/40 border-white/10 focus:bg-card/60 focus:border-primary/50 transition-all font-black text-xl placeholder:text-muted-foreground/30 shadow-2xl backdrop-blur-xl ring-0 focus-visible:ring-0"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Customers Table Container */}
            <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        <h2 className="text-2xl font-black tracking-tight">قائمة العملاء</h2>
                    </div>
                    <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary font-black">
                        {pagination.total} عميل مسجل
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/5 h-16 bg-white/[0.01]">
                                <TableHead className="w-[80px] px-8"></TableHead>
                                <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">{tableCustomer}</TableHead>
                                <TableHead className="text-right font-black text-white/40 uppercase tracking-widest text-xs px-8">{tableContact}</TableHead>
                                <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8">{tablePriceType}</TableHead>
                                <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8">{tableDebt}</TableHead>
                                <TableHead className="text-center font-black text-white/40 uppercase tracking-widest text-xs px-8">{tableActions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableLoadingState colSpan={6} message={loadingLabel} />
                            ) : queryData?.isError ? (
                                <TableErrorState colSpan={6} onRetry={refetch} />
                            ) : customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-96 text-center border-none">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner group">
                                                <Users className="h-16 w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-2xl font-black text-white/30">{noCustomers}</p>
                                                <p className="text-sm text-white/10 font-bold uppercase tracking-widest">تحقق من معايير البحث</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customers.map((customer) => (
                                    <CustomerRow
                                        key={customer._id}
                                        customer={customer}
                                        customerDebts={customerDebts}
                                        onEdit={handleEditClick}
                                        onDelete={handleDelete}
                                        onRowClick={handleRowClick}
                                        onHistory={(customer) => {
                                            setDetailCustomer(customer);
                                            setIsHistoryOpen(true);
                                        }}
                                        router={router}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Elegant Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center pt-8" dir="ltr">
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

            {/* Page info */}
            {!isLoading && pagination.total > 0 && (
                <p className="text-center text-sm font-black text-white/10 uppercase tracking-[0.2em] pt-4">
                    {LABELS.pagination.page} {page} {LABELS.pagination.of} {totalPages} ({pagination.total} {LABELS.pagination.customer})
                </p>
            )}

            {/* Detail Sheet & Dialogs */}
            <CustomerDetailsSheet
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                customer={detailCustomer}
                debts={customerDebts.filter(d => d.debtorId?._id === detailCustomer?._id || d.debtorId === detailCustomer?._id) || []}
                invoices={collectionInvoices}
                onRecordPayment={handleRecordPayment}
                onManageInstallment={handleScheduleInstallment}
                onCollectInvoice={(invoice) => {
                    setSelectedInvoice(invoice);
                    setIsInvoicePaymentOpen(true);
                }}
                onUnifiedCollection={handleUnifiedCollection}
            />

            <CustomerFormDialog
                open={isAddOpen || isEditOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddOpen(false);
                        setIsEditOpen(false);
                        setSelectedCustomer(null);
                    }
                }}
                mode={isEditOpen ? 'edit' : 'add'}
                initialData={selectedCustomer}
                onSubmit={handleFormSubmit}
                isPending={addMutation.isPending || updateMutation.isPending}
            />

            <PaymentDialog
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                debt={selectedDebt}
            />

            <InvoicePaymentDialog
                open={isInvoicePaymentOpen}
                onOpenChange={setIsInvoicePaymentOpen}
                invoice={selectedInvoice}
                onSuccess={() => {
                    setIsInvoicePaymentOpen(false);
                    setSelectedInvoice(null);
                }}
            />

            <InstallmentDialog
                open={isInstallmentOpen}
                onOpenChange={setIsInstallmentOpen}
                debt={selectedDebt}
            />

            <UnifiedPaymentDialog
                open={isUnifiedOpen}
                onOpenChange={setIsUnifiedOpen}
                customerId={unifiedPaymentData?.id}
                customerName={unifiedPaymentData?.name}
                totalBalance={unifiedPaymentData?.balance}
            />

            <PartnerTransactionDialog
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                partner={detailCustomer}
            />
        </div>
    );
}
