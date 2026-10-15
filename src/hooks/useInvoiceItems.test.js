/**
 * Invoice items math (FE-TEST-002): stock-aware quantity clamping and the
 * item shape the invoice totals formula depends on (qty × unitPrice).
 *
 * CJS style — required for jest.mock hoisting under next/jest (SWC).
 */
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
        info: jest.fn(),
    },
}));

jest.mock('@/services/productService', () => ({
    getProducts: jest.fn(),
}));

const { renderHook, act } = require('@testing-library/react');
const { useInvoiceItems } = require('./useInvoiceItems');
const { toast } = require('sonner');

function hookWithMutableItems(initial) {
    let current = initial;
    const { result, rerender } = renderHook(
        ({ items }) => useInvoiceItems({ items, setItems: (u) => { current = typeof u === 'function' ? u(current) : u; } }),
        { initialProps: { items: initial } }
    );
    return { result, rerender: () => rerender({ items: current }), getCurrent: () => current };
}

const SHOP_PRODUCT = {
    _id: 'p1', name: 'منتج أ', code: 'A1',
    retailPrice: 100, buyPrice: 60,
    shopQty: 5, warehouseQty: 10,
};

describe('useInvoiceItems — totals-critical behavior', () => {
    beforeEach(() => jest.clearAllMocks());

    it('addItem creates an item whose qty × unitPrice feeds the subtotal', () => {
        const { result, getCurrent } = hookWithMutableItems([]);
        act(() => result.current.addItem(SHOP_PRODUCT));

        expect(getCurrent()).toHaveLength(1);
        expect(getCurrent()[0]).toMatchObject({
            productId: 'p1',
            unitPrice: 100,
            qty: 1,
            source: 'shop',
            maxQty: 5,
        });
        const subtotal = getCurrent().reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
        expect(subtotal).toBe(100);
    });

    it('updateQty rejects quantities above available shop stock', () => {
        const existing = [{ productId: 'p1', name: 'منتج أ', unitPrice: 100, qty: 2, source: 'shop', shopQty: 5, warehouseQty: 10, buyPrice: 60 }];
        const { result, getCurrent } = hookWithMutableItems(existing);

        act(() => result.current.updateQty(0, 99));
        expect(toast.error).toHaveBeenCalled();
        expect(getCurrent()[0].qty).toBe(2);
    });

    it('updatePrice rejects non-positive prices that would zero the subtotal', () => {
        const existing = [{ productId: 'p1', unitPrice: 100, qty: 1, source: 'shop', shopQty: 5, warehouseQty: 0, buyPrice: 60 }];
        const { result, getCurrent } = hookWithMutableItems(existing);

        act(() => result.current.updatePrice(0, 0));
        expect(toast.error).toHaveBeenCalledWith('السعر يجب أن يكون أكبر من صفر');
        expect(getCurrent()[0].unitPrice).toBe(100);
    });

    it('removeItem drops exactly one row so totals shrink correctly', () => {
        const two = [
            { productId: 'p1', unitPrice: 100, qty: 1 },
            { productId: 'p2', unitPrice: 50, qty: 2 },
        ];
        const { result, getCurrent } = hookWithMutableItems(two);

        act(() => result.current.removeItem(0));
        const subtotal = getCurrent().reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
        expect(getCurrent()).toHaveLength(1);
        expect(subtotal).toBe(100);
    });
});

const WAREHOUSE_PRODUCT = {
    _id: 'w1', name: 'منتج مخزن', code: 'W1',
    retailPrice: 100, buyPrice: 60,
    shopQty: 3, warehouseQty: 4,
    warehouseStocks: [
        { warehouseId: 'wh-a', qty: 7 },
        { warehouseId: 'wh-b', qty: 0 },
    ],
};

describe('useInvoiceItems — multi-warehouse source selection', () => {
    beforeEach(() => jest.clearAllMocks());

    it('addItem carries the slot list and defaults the warehouse to the primary (null)', () => {
        const { result, getCurrent } = hookWithMutableItems([]);
        act(() => result.current.addItem(WAREHOUSE_PRODUCT));

        expect(getCurrent()[0]).toMatchObject({
            warehouseId: null,
            warehouseStocks: WAREHOUSE_PRODUCT.warehouseStocks,
        });
    });

    it('availableQty resolves primary vs each warehouse slot', () => {
        const { result } = hookWithMutableItems([]);
        const item = {
            source: 'warehouse', warehouseQty: 4, shopQty: 3,
            warehouseStocks: WAREHOUSE_PRODUCT.warehouseStocks,
            warehouseId: null,
        };

        expect(result.current.availableQty(item)).toBe(4);          // primary
        expect(result.current.availableQty(item, 'wh-a')).toBe(7);  // slot
        expect(result.current.availableQty(item, 'wh-b')).toBe(0);  // empty slot
        expect(result.current.availableQty({ ...item, source: 'shop' })).toBe(3);
    });

    it('updateWarehouse switches the slot and clamps qty to the new availability', () => {
        const existing = [{
            productId: 'w1', name: 'منتج مخزن', unitPrice: 100, qty: 4,
            source: 'warehouse', warehouseId: null, warehouseQty: 4, shopQty: 3,
            warehouseStocks: WAREHOUSE_PRODUCT.warehouseStocks, buyPrice: 60,
        }];
        const { result, getCurrent } = hookWithMutableItems(existing);

        // Move to a slot holding fewer units than the current qty → clamp.
        act(() => result.current.updateWarehouse(0, 'wh-b'));
        expect(getCurrent()[0].warehouseId).toBe('wh-b');
        expect(getCurrent()[0].qty).toBe(0);

        act(() => result.current.updateWarehouse(0, 'wh-a'));
        expect(getCurrent()[0].warehouseId).toBe('wh-a');
        expect(getCurrent()[0].qty).toBeLessThanOrEqual(7);
    });

    it('updateQty rejects quantities above the selected slot, not the global total', () => {
        const existing = [{
            productId: 'w1', unitPrice: 100, qty: 1,
            source: 'warehouse', warehouseId: 'wh-a', warehouseQty: 4, shopQty: 3,
            warehouseStocks: WAREHOUSE_PRODUCT.warehouseStocks, buyPrice: 60,
        }];
        const { result, getCurrent } = hookWithMutableItems(existing);

        act(() => result.current.updateQty(0, 8)); // slot has only 7
        expect(toast.error).toHaveBeenCalled();
        expect(getCurrent()[0].qty).toBe(1);
    });

    it('updateSource resets the warehouse selection back to the primary', () => {
        const existing = [{
            productId: 'w1', unitPrice: 100, qty: 1,
            source: 'warehouse', warehouseId: 'wh-a', warehouseQty: 4, shopQty: 3,
            warehouseStocks: WAREHOUSE_PRODUCT.warehouseStocks, buyPrice: 60,
        }];
        const { result, getCurrent } = hookWithMutableItems(existing);

        act(() => result.current.updateSource(0, 'shop'));
        expect(getCurrent()[0].warehouseId).toBeNull();
    });
});
