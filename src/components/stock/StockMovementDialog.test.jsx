/**
 * StockMovementDialog — inter-warehouse transfer (WH-09 FE).
 *
 * Selecting "تحويل بين المخازن" swaps the single warehouse picker for a
 * source/destination pair and submits a single-product transfer payload
 * (blank id = primary warehouse) that the stock page routes to /api/stock/transfer.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { StockMovementDialog } from './StockMovementDialog';

jest.mock('@/hooks/useProducts', () => ({ useProducts: () => ({ data: { products: [] }, isLoading: false }) }));

jest.mock('@/hooks/useWarehouses', () => ({
    useWarehouses: () => ({
        data: {
            warehouses: [
                { _id: 'main', name: 'المخزن الرئيسي', code: 'MAIN', isPrimary: true, isActive: true },
                { _id: 'w2', name: 'مخزن الفرع', code: 'BR', isPrimary: false, isActive: true },
            ],
        },
    }),
    usePrimaryWarehouse: () => ({ data: { _id: 'main', name: 'المخزن الرئيسي', isPrimary: true } }),
}));

// Cycles products so a bulk list can contain distinct items; reset per test.
jest.mock('@/components/products/ProductSelector', () => {
    let count = 0;
    return {
        ProductSelector: ({ onSelect }) => (
            <button
                type="button"
                data-testid="pick-product"
                onClick={() => {
                    count += 1;
                    onSelect({ _id: `p${count}`, name: `منتج ${count}` });
                }}
            >
                pick
            </button>
        ),
        __resetProductSelector: () => { count = 0; },
    };
});

const { __resetProductSelector } = require('@/components/products/ProductSelector');

function setup() {
    const onSubmit = jest.fn();
    render(<StockMovementDialog open onOpenChange={() => {}} onSubmit={onSubmit} isSubmitting={false} />);
    return { onSubmit };
}

beforeEach(() => __resetProductSelector());

describe('StockMovementDialog — inter-warehouse transfer', () => {
    test('shows source + destination pickers (not the single picker) for the transfer type', () => {
        setup();
        expect(screen.getByTestId('stock-movement-warehouse')).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('stock-movement-type'), { target: { value: 'TRANSFER_WAREHOUSE' } });

        expect(screen.queryByTestId('stock-movement-warehouse')).not.toBeInTheDocument();
        expect(screen.getByTestId('stock-movement-from-warehouse')).toBeInTheDocument();
        expect(screen.getByTestId('stock-movement-to-warehouse')).toBeInTheDocument();
    });

    test('submits a TRANSFER_WAREHOUSE payload with source/destination ids', () => {
        const { onSubmit } = setup();

        fireEvent.change(screen.getByTestId('stock-movement-type'), { target: { value: 'TRANSFER_WAREHOUSE' } });
        fireEvent.click(screen.getByTestId('pick-product'));
        fireEvent.change(screen.getByPlaceholderText('الكمية'), { target: { value: '4' } });
        // blank value = primary warehouse source, non-primary destination
        fireEvent.change(screen.getByTestId('stock-movement-from-warehouse'), { target: { value: '' } });
        fireEvent.change(screen.getByTestId('stock-movement-to-warehouse'), { target: { value: 'w2' } });

        fireEvent.submit(screen.getByTestId('stock-movement-type').closest('form'));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const [payload] = onSubmit.mock.calls[0];
        expect(payload).toMatchObject({
            type: 'TRANSFER_WAREHOUSE',
            productId: 'p1',
            qty: 4,
            fromWarehouseId: null,
            toWarehouseId: 'w2',
        });
    });

    test('submits a bulk TRANSFER_WAREHOUSE payload when multiple products are queued', () => {
        const { onSubmit } = setup();

        fireEvent.change(screen.getByTestId('stock-movement-type'), { target: { value: 'TRANSFER_WAREHOUSE' } });
        fireEvent.change(screen.getByTestId('stock-movement-from-warehouse'), { target: { value: 'w2' } });
        fireEvent.change(screen.getByTestId('stock-movement-to-warehouse'), { target: { value: '' } });

        // Queue two distinct products.
        fireEvent.click(screen.getByTestId('pick-product'));
        fireEvent.change(screen.getByPlaceholderText('الكمية'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: /إدراج للقائمة/ }));

        fireEvent.click(screen.getByTestId('pick-product'));
        fireEvent.change(screen.getByPlaceholderText('الكمية'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: /إدراج للقائمة/ }));

        fireEvent.submit(screen.getByTestId('stock-movement-type').closest('form'));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const [payload] = onSubmit.mock.calls[0];
        expect(payload).toMatchObject({
            type: 'TRANSFER_WAREHOUSE',
            fromWarehouseId: 'w2',
            toWarehouseId: null,
        });
        expect(payload.items).toEqual([
            { productId: 'p1', qty: 2, note: '' },
            { productId: 'p2', qty: 5, note: '' },
        ]);
    });
});
