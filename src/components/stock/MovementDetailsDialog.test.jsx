/**
 * MovementDetailsDialog — full transfer details (qty, source & destination)
 * and the undo (reversal) action for transfer movements.
 */
import { render, screen, fireEvent } from '@testing-library/react';
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

jest.mock('@/hooks/useUserRole', () => ({
    useUserRole: () => ({ role: 'owner', user: { name: 'مدير' }, loading: false }),
}));

const reverseMock = jest.fn();
jest.mock('@/hooks/useStock', () => ({
    useReverseStockMovement: () => ({ mutate: reverseMock, isPending: false }),
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

describe('MovementDetailsDialog — undo (reversal)', () => {
    beforeEach(() => reverseMock.mockReset());

    test('offers an undo action for an irreversible-once transfer covering a populated dialog', () => {
        render(<MovementDetailsDialog open onOpenChange={() => {}} movement={transfer} />);
        const undo = screen.getByTestId('movement-details-undo');
        expect(undo).toBeInTheDocument();
        expect(undo).toHaveTextContent('تراجع عن هذه الحركة');
    });

    test('sends the reversal request with the movement id and note', () => {
        render(<MovementDetailsDialog open onOpenChange={() => {}} movement={transfer} />);
        fireEvent.click(screen.getByTestId('movement-details-undo'));

        fireEvent.change(screen.getByTestId('movement-details-undo-note'), { target: { value: 'خطأ في الطلب' } });
        fireEvent.click(screen.getByTestId('movement-details-undo-confirm'));

        expect(reverseMock).toHaveBeenCalledTimes(1);
        const payload = reverseMock.mock.calls[0][0];
        expect(payload.movementId).toBe('m1');
        expect(payload.note).toBe('خطأ في الطلب');
    });

    test('disables the undo action when the movement is already reversed', () => {
        render(
            <MovementDetailsDialog
                open
                onOpenChange={() => {}}
                movement={{ ...transfer, reversed: true, reverses: undefined }}
            />
        );
        expect(screen.queryByTestId('movement-details-undo')).not.toBeInTheDocument();
        // The visible warning badge replaces it
        expect(screen.getByText('تم التراجع عن هذه الحركة')).toBeInTheDocument();
    });

    test('does not offer undo for non-transfer movements (sales, IN, ADJUST)', () => {
        const { unmount } = render(
            <MovementDetailsDialog open onOpenChange={() => {}} movement={{ ...transfer, type: 'IN' }} />
        );
        expect(screen.queryByTestId('movement-details-undo')).not.toBeInTheDocument();
        unmount();

        render(
            <MovementDetailsDialog open onOpenChange={() => {}} movement={{ ...transfer, type: 'REVERSAL' }} />
        );
        expect(screen.queryByTestId('movement-details-undo')).not.toBeInTheDocument();
    });
});
