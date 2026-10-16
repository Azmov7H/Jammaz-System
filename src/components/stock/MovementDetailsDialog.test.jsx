/**
 * MovementDetailsDialog — full transfer details (qty, source & destination).
 */
import { render, screen } from '@testing-library/react';
import { MovementDetailsDialog } from './MovementDetailsDialog';

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

const transfer = {
    _id: 'm1',
    type: 'TRANSFER',
    qty: 7,
    date: '2026-01-15T10:30:00.000Z',
    note: 'نقل بين المخازن',
    productId: { _id: 'p1', name: 'منتج أ', code: 'P-A' },
    fromWarehouseId: { _id: 'w2', name: 'مخزن الفرع', code: 'BR' },
    toWarehouseId: null,
    createdBy: { name: 'مدير المخزن' },
    snapshot: { warehouseQty: 13, shopQty: 4 },
};

describe('MovementDetailsDialog', () => {
    test('renders the quantity and source/destination warehouses', () => {
        render(<MovementDetailsDialog open onOpenChange={() => {}} movement={transfer} />);

        expect(screen.getByTestId('movement-details-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('movement-details-qty')).toHaveTextContent('7');
        expect(screen.getByTestId('movement-details-from')).toHaveTextContent('مخزن الفرع');
        // A null destination id resolves to the primary warehouse name.
        expect(screen.getByTestId('movement-details-to')).toHaveTextContent('المخزن الرئيسي');
        expect(screen.getByText('منتج أ')).toBeInTheDocument();
        expect(screen.getByText('نقل بين المخازن')).toBeInTheDocument();
    });

    test('resolves a raw (unpopulated) destination id via the warehouses list', () => {
        render(
            <MovementDetailsDialog
                open
                onOpenChange={() => {}}
                movement={{ ...transfer, fromWarehouseId: null, toWarehouseId: 'w2' }}
            />
        );
        expect(screen.getByTestId('movement-details-from')).toHaveTextContent('المخزن الرئيسي');
        expect(screen.getByTestId('movement-details-to')).toHaveTextContent('مخزن الفرع');
    });

    test('renders nothing when there is no movement', () => {
        const { container } = render(<MovementDetailsDialog open onOpenChange={() => {}} movement={null} />);
        expect(container).toBeEmptyDOMElement();
    });
});
