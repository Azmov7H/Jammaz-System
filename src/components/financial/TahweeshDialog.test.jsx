/**
 * FIN-TAHWEESH-05 (T-14) — transfer dialog UX.
 *
 * The set-aside stays visually separated; over-amounts are refused with a
 * toast (never silently clamped); deposit sources exclude bank.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { TahweeshDialog } from './TahweeshDialog';
import { toast } from 'sonner';

jest.mock('@/hooks/useFinancial', () => ({
    useTahweeshBalance: () => ({ data: { balance: 5000 } }),
    useTahweeshDeposit: () => ({
        mutate: (...args) => { globalThis.__depositArgs = args; },
        isPending: false,
    }),
    useTahweeshWithdraw: () => ({
        mutate: (...args) => { globalThis.__withdrawArgs = args; },
        isPending: false,
    }),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/components/common/PaymentMethodSelect', () => ({
    PaymentMethodSelect: (props) => {
        globalThis.__depositSources = props.methods;
        return <div data-testid="source-select" />;
    },
}));

const BREAKDOWN = { cash: 80000, bank: 0, wallet: 10000, instapay: 0, check: 0, tahweesh: 5000 };

function openDialog() {
    render(<TahweeshDialog breakdown={BREAKDOWN} />);
    fireEvent.click(screen.getByText('تحويش'));
}

describe('TahweeshDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        globalThis.__depositArgs = undefined;
        globalThis.__withdrawArgs = undefined;
    });

    test('opens with the cash available shown and no bank source', () => {
        openDialog();
        expect(screen.getByText(/المتاح في الخزينة النقدية/)).toBeInTheDocument();
        expect(globalThis.__depositSources).toEqual(['cash', 'instapay', 'wallet']);
        expect(globalThis.__depositSources).not.toContain('bank');
    });

    test('deposit over the available toasts and never submits', () => {
        openDialog();
        fireEvent.change(screen.getByLabelText('المبلغ *'), { target: { value: '90000' } });
        fireEvent.submit(document.querySelector('form'));
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('يتجاوز المتاح'));
        expect(globalThis.__depositArgs).toBeUndefined();
    });

    test('exact-available deposit submits with a transfer id', () => {
        openDialog();
        fireEvent.change(screen.getByLabelText('المبلغ *'), { target: { value: '80000' } });
        fireEvent.submit(document.querySelector('form'));
        expect(toast.error).not.toHaveBeenCalled();
        const [payload] = globalThis.__depositArgs;
        expect(payload).toMatchObject({ source: 'cash', amount: 80000 });
        expect(typeof payload.transferId).toBe('string');
    });

    test('withdraw mode uses the set-aside balance as the ceiling', () => {
        openDialog();
        fireEvent.click(screen.getByText('سحب إلى الخزينة'));
        expect(screen.getByText('رصيد التحويش الحالي')).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('المبلغ *'), { target: { value: '6000' } });
        fireEvent.submit(document.querySelector('form'));
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('يتجاوز المتاح'));
        expect(globalThis.__withdrawArgs).toBeUndefined();

        fireEvent.change(screen.getByLabelText('المبلغ *'), { target: { value: '5000' } });
        fireEvent.submit(document.querySelector('form'));
        const [payload] = globalThis.__withdrawArgs;
        expect(payload).toMatchObject({ amount: 5000 });
    });
});
