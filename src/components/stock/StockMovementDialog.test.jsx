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

jest.mock('@/components/products/ProductSelector', () => ({
    ProductSelector: ({ onSelect }) => (
        <button type="button" data-testid="pick-product" onClick={() => onSelect({ _id: 'p1', name: 'منتج' })}>
            pick
        </button>
    ),
}));

function setup() {
    const onSubmit = jest.fn();
    render(<StockMovementDialog open onOpenChange={() => {}} onSubmit={onSubmit} isSubmitting={false} />);
    return { onSubmit };
}

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
});
