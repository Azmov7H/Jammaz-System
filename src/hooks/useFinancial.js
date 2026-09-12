// Financial hooks for treasury and debts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import {
    getTreasury,
    getTreasuryTransactions,
    getCashFlow,
    addTreasuryTransaction,
    deleteTreasuryTransaction,
    getDebts,
    getDebtors,
    getDebtOverview,
    addPayment,
    addSupplierPayment,
    getDebtInstallments,
    createInstallments,
    getReceivables,
    syncDebts,
    updateDebt,
    payCustomerTotal,
    getPartnerTransactions,
    getTahweeshBalance,
    depositTahweesh,
    withdrawTahweesh
} from '@/services/financeService';
import { withMutationFeedback } from '@/lib/mutation-feedback';

/**
 * Treasury dashboard live options: the /financial page must reflect sales,
 * purchases and collections recorded elsewhere, so its queries poll every
 * 30s and refetch on focus (the app default disables focus refetch).
 */
const TREASURY_LIVE_OPTIONS = {
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
};

export function useTreasury(params = {}) {
    return useQuery({
        queryKey: ['treasury', params],
        queryFn: ({ signal }) => getTreasury(params, { signal }),
        placeholderData: keepPreviousData,
        ...TREASURY_LIVE_OPTIONS,
    });
}

/**
 * Server-paginated transaction ledger for a date range. Returns
 * `{ transactions, total, page, limit }` — `total` covers the whole
 * window so the UI can page through the full history (the old bare-array
 * contract is still tolerated for forward/backward compatibility).
 */
const LEDGER_PAGE_SIZE = 100;

export function useTreasuryTransactions(dateRange = {}, { page = 1, limit = LEDGER_PAGE_SIZE, type, category } = {}, options = {}) {
    const params = { ...dateRange, page, limit };
    if (type) params.type = type;
    if (category) params.category = category;
    return useQuery({
        queryKey: ['treasury-transactions', dateRange, page, limit, type, category],
        queryFn: async ({ signal }) => {
            const res = await getTreasuryTransactions(params, { signal });
            if (Array.isArray(res)) return { transactions: res, total: res.length, page, limit };
            const transactions = res?.transactions && Array.isArray(res.transactions)
                ? res.transactions
                : (res?.data && Array.isArray(res.data) ? res.data : []);
            return {
                transactions,
                total: Number.isFinite(Number(res?.total)) ? Number(res.total) : transactions.length,
                page: Number(res?.page) || page,
                limit: Number(res?.limit) || limit,
            };
        },
        placeholderData: keepPreviousData,
        enabled: options.enabled !== false,
        ...TREASURY_LIVE_OPTIONS,
    });
}

/**
 * Full-period cash-flow buckets for the treasury chart (server-aggregated).
 */
export function useCashFlow(dateRange = {}, options = {}) {
    return useQuery({
        queryKey: ['treasury-cashflow', dateRange],
        queryFn: ({ signal }) => getCashFlow(dateRange, { signal }),
        placeholderData: keepPreviousData,
        enabled: options.enabled !== false,
        ...TREASURY_LIVE_OPTIONS,
    });
}

/** Supplier payment (manager+) with treasury + receivables invalidation. */
export function useSupplierPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => addSupplierPayment(data),
        ...withMutationFeedback({
            successMessage: 'تم تسجيل الدفعة للمورد بنجاح',
            fallbackErrorMessage: 'فشل تسجيل الدفعة للمورد',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['treasury'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
            }
        })
    });
}

export function useAddTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => addTreasuryTransaction(data),
        ...withMutationFeedback({
            successMessage: 'تم تسجيل المعاملة بنجاح',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['treasury'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
            }
        })
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => deleteTreasuryTransaction(id),
        ...withMutationFeedback({
            successMessage: 'تم التراجع عن المعاملة بنجاح',
            fallbackErrorMessage: 'فشل التراجع عن المعاملة',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['treasury'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
            }
        })
    });
}

/**
 * FIN-TAHWEESH-04/05 — set-aside balance + transfer mutations.
 * Balance polls with the treasury rhythm so the dialog ceiling stays fresh.
 */
export function useTahweeshBalance(options = {}) {
    return useQuery({
        queryKey: ['tahweesh-balance'],
        queryFn: ({ signal }) => getTahweeshBalance({ signal }),
        ...TREASURY_LIVE_OPTIONS,
        ...options,
    });
}

const invalidateMoney = (queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['treasury'] });
    queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
    queryClient.invalidateQueries({ queryKey: ['tahweesh-balance'] });
};

export function useTahweeshDeposit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => depositTahweesh(data),
        ...withMutationFeedback({
            successMessage: 'تم التحويل إلى التحويش بنجاح',
            fallbackErrorMessage: 'فشل التحويل إلى التحويش',
            afterSuccess: () => invalidateMoney(queryClient),
        })
    });
}

export function useTahweeshWithdraw() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => withdrawTahweesh(data),
        ...withMutationFeedback({
            successMessage: 'تم السحب من التحويش بنجاح',
            fallbackErrorMessage: 'فشل السحب من التحويش',
            afterSuccess: () => invalidateMoney(queryClient),
        })
    });
}

export function useDebts(params = {}, options = {}) {
    return useQuery({
        queryKey: ['debts', params],
        queryFn: ({ signal }) => getDebts(params, { signal }),
        enabled: options.enabled !== false
    });
}

export function useDebtors(params = {}) {
    return useQuery({
        queryKey: ['debtors', params],
        queryFn: ({ signal }) => getDebtors(params, { signal })
    });
}

export function useDebtOverview(options = {}) {
    return useQuery({
        queryKey: ['debt-overview'],
        queryFn: ({ signal }) => getDebtOverview({ signal }),
        enabled: options.enabled !== false
    });
}

export function useAddPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => addPayment(data),
        ...withMutationFeedback({
            successMessage: 'تم تسجيل الدفعة بنجاح',
            fallbackErrorMessage: 'فشل تسجيل الدفعة',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['debts'] });
                queryClient.invalidateQueries({ queryKey: ['debt-overview'] });
                queryClient.invalidateQueries({ queryKey: ['treasury'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
            }
        })
    });
}

export function useDebtInstallments(debtId) {
    return useQuery({
        queryKey: ['debt-installments', debtId],
        queryFn: ({ signal }) => getDebtInstallments(debtId, { signal }),
        enabled: !!debtId
    });
}

export function useCreateInstallments() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ debtId, data }) => createInstallments(debtId, data),
        ...withMutationFeedback({
            successMessage: 'تم جدولة المديونية بنجاح',
            fallbackErrorMessage: 'فشل جدولة المديونية',
            afterSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['debts'] });
                queryClient.invalidateQueries({ queryKey: ['debt-installments', variables.debtId] });
            }
        })
    });
}

export function useReceivables(params = {}, options = {}) {
    return useQuery({
        queryKey: ['receivables', params],
        queryFn: ({ signal }) => getReceivables(params, { signal }),
        enabled: options.enabled !== false
    });
}

export function useSyncDebts() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            return await syncDebts(data);
        },
        ...withMutationFeedback({
            successMessage: 'تمت مزامنة المديونيات بنجاح',
            fallbackErrorMessage: 'فشل مزامنة المديونيات',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['debts'] });
                queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            }
        })
    });
}

export function useUpdateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateDebt(id, data),
        ...withMutationFeedback({
            successMessage: 'تم تحديث بيانات الدين بنجاح',
            fallbackErrorMessage: 'فشل تحديث بيانات الدين',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['debts'] });
                queryClient.invalidateQueries({ queryKey: ['debt-overview'] });
            }
        })
    });
}

export function useCustomerTotalPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ customerId, data }) => payCustomerTotal(customerId, data),
        ...withMutationFeedback({
            successMessage: 'تم تحصيل الدفعة بنجاح وتوزيعها على الفواتير',
            fallbackErrorMessage: 'فشل تحصيل الدفعة',
            afterSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['debts'] });
                queryClient.invalidateQueries({ queryKey: ['debt-overview'] });
                queryClient.invalidateQueries({ queryKey: ['customer'] });
                queryClient.invalidateQueries({ queryKey: ['customer-statement'] });
                queryClient.invalidateQueries({ queryKey: ['treasury'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['treasury-cashflow'] });
            }
        })
    });
}
export function usePartnerTransactions(partnerId, params = {}) {
    return useQuery({
        queryKey: ['partner-transactions', partnerId, params],
        queryFn: async ({ signal }) => {
            const res = await getPartnerTransactions(partnerId, params, { signal });
            if (Array.isArray(res)) return res;
            if (res?.transactions && Array.isArray(res.transactions)) return res.transactions;
            if (res?.data && Array.isArray(res.data)) return res.data;
            return [];
        },
        enabled: !!partnerId
    });
}
