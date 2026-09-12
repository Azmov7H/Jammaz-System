/**
 * FIN-OVERDEDUCT — payment dialog overpay UX.
 *
 * The backend rejects overpay; the dialog must surface the available
 * ceiling (input max) and refuse to submit an over-amount with a clear
 * toast instead of silently modifying it.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedPaymentDialog } from './PaymentDialog';
import { toast } from 'sonner';
import { api } from '@/lib/api-utils';

const STABLE_INSTALLMENTS = [];
jest.mock('@/hooks/useFinancial', () => ({
    useAddPayment: () => ({ mutate: jest.fn(), isPending: false }),
    useCustomerTotalPayment: () => ({ mutate: jest.fn(), isPending: false }),
    useDebtInstallments: () => ({ data: STABLE_INSTALLMENTS, isLoading: false }),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@tanstack/react-query', () => ({
    useMutation: () => ({ mutate: jest.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/lib/api-utils', () => ({ api: { post: jest.fn() } }));
// Capture the methods prop to lock T-08 wiring (Radix options only mount
// when open, which jsdom cannot drive reliably without user-event).
jest.mock('@/components/common/PaymentMethodSelect', () => ({
    PaymentMethodSelect: (props) => {
        globalThis.__lastMethodOptions = props.methods;
        return <div data-testid="method-select" />;
    },
}));

const INVOICE = { _id: 'inv1', number: 'INV-1', total: 100, paidAmount: 20 };

function setup(target = { kind: 'invoice', invoice: INVOICE }) {
    return render(<UnifiedPaymentDialog open onOpenChange={() => {}} target={target} />);
}

describe('UnifiedPaymentDialog overpay UX', () => {
    beforeEach(() => jest.clearAllMocks());

    test('amount input carries the remaining as max', () => {
        setup();
        const input = screen.getByLabelText('قيمة الدفعة *');
        expect(input).toHaveAttribute('max', '80');
    });

    test('submitting more than the remaining toasts an error and never posts', () => {
        setup(); // Radix Dialog portals to document.body
        fireEvent.change(screen.getByLabelText('قيمة الدفعة *'), { target: { value: '500' } });
        fireEvent.submit(document.querySelector('form'));
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('يتجاوز المتاح'));
        expect(api.post).not.toHaveBeenCalled();
    });

    test('exact remaining submits normally', () => {
        setup();
        fireEvent.change(screen.getByLabelText('قيمة الدفعة *'), { target: { value: '80' } });
        fireEvent.submit(document.querySelector('form'));
        expect(toast.error).not.toHaveBeenCalled();
    });

    test.each([
        ['invoice', { kind: 'invoice', invoice: INVOICE }],
        ['customer-total', { kind: 'customer-total', customerId: 'c1', customerName: 'عميل', totalBalance: 200 }],
        ['debt', { kind: 'debt', debt: { _id: 'd1', remainingAmount: 150, debtorId: {}, referenceType: 'Invoice' } }],
    ])('T-08: %s offers no bank option', (_kind, target) => {
        setup(target);
        expect(globalThis.__lastMethodOptions).toBeDefined();
        expect(globalThis.__lastMethodOptions).not.toContain('bank');
    });

    test('T-08: history labels still resolve bank (read path kept)', async () => {
        const { getPaymentLabel } = await import('@/lib/paymentMethods');
        expect(getPaymentLabel('bank')).toBe('تحويل بنكي');
    });
});
