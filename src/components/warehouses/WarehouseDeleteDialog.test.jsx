/**
 * WarehouseDeleteDialog — preflight-driven delete UX (WH-04).
 *
 * The dialog is driven entirely by the backend deletion-preflight: primary
 * warehouses are locked, warehouses with open POs are blocked, warehouses
 * holding stock require a destination + explicit confirmation, and empty
 * warehouses can be removed directly.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { WarehouseDeleteDialog } from './WarehouseDeleteDialog';

let preflight = { canDelete: true };
jest.mock('@/hooks/useWarehouses', () => ({
    useWarehouseDeletionPreflight: () => ({ data: preflight, isLoading: false }),
}));

const WAREHOUSE = { _id: 'w1', name: 'مخزن الفرع', code: 'WH-1' };

function setup(warehouse = WAREHOUSE, props = {}) {
    const onConfirm = jest.fn();
    render(
        <WarehouseDeleteDialog
            open
            onOpenChange={jest.fn()}
            warehouse={warehouse}
            onConfirm={onConfirm}
            isPending={false}
            {...props}
        />
    );
    return { onConfirm };
}

beforeEach(() => { preflight = { canDelete: true }; });

describe('WarehouseDeleteDialog — deletion guards', () => {
    test('locks the primary warehouse with an informational message', () => {
        preflight = { canDelete: false, isPrimary: true, reason: 'PRIMARY' };
        setup({ _id: 'p', name: 'المخزن الرئيسي', isPrimary: true });

        expect(screen.getByText(/المخزن الرئيسي نظامي ولا يمكن حذفه/)).toBeInTheDocument();
        expect(screen.getByTestId('warehouse-delete-submit')).toBeDisabled();
    });

    test('blocks deletion when there are open purchase orders', () => {
        preflight = { canDelete: false, blockedByPurchaseOrders: true, openPurchaseOrders: 3 };
        setup();

        expect(screen.getByText(/3 أمر شراء مفتوح/)).toBeInTheDocument();
        expect(screen.getByTestId('warehouse-delete-submit')).toBeDisabled();
    });

    test('requires a destination + confirmation when stock is present', () => {
        preflight = {
            canDelete: true,
            requiresDestination: true,
            totalUnits: 42,
            affectedProducts: 5,
            availableDestinations: [{ _id: 'w2', name: 'المخزن الرئيسي', code: 'MAIN', isPrimary: true }],
        };
        setup();

        expect(screen.getByTestId('warehouse-destination-select')).toBeInTheDocument();
        const confirmBox = screen.getByTestId('warehouse-delete-confirm-checkbox');
        const submit = screen.getByTestId('warehouse-delete-submit');

        // Without a destination/confirmation the destructive action stays disabled.
        expect(submit).toBeDisabled();

        fireEvent.click(confirmBox);
        // Confirmation is recorded, but a destination is still required → disabled.
        expect(confirmBox).toBeChecked();
        expect(submit).toBeDisabled();
    });

    test('allows an empty warehouse to be deleted directly', () => {
        preflight = { canDelete: true, requiresDestination: false, totalUnits: 0, affectedProducts: 0 };
        const { onConfirm } = setup();

        const submit = screen.getByTestId('warehouse-delete-submit');
        expect(submit).not.toBeDisabled();

        fireEvent.click(submit);
        expect(onConfirm).toHaveBeenCalledWith({ destinationWarehouseId: undefined, confirmed: undefined });
    });
});
