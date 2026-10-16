/**
 * stockService — inter-warehouse transfer contract (WH-09 FE).
 *
 * transferStock must always send from/to = 'warehouse' and pass the source and
 * destination ids through (null = primary warehouse).
 */
jest.mock('@/lib/api-utils', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));

const { api } = require('@/lib/api-utils');
const { moveStock, transferStock } = require('./stockService');

beforeEach(() => jest.clearAllMocks());

describe('stockService.transferStock', () => {
    test('posts to /api/stock/transfer with explicit warehouse endpoints', async () => {
        api.post.mockResolvedValue({ product: {}, movement: {} });
        await transferStock({
            productId: 'p1',
            qty: 3,
            fromWarehouseId: 'w1',
            toWarehouseId: null,
            note: 'نقل',
        });
        expect(api.post).toHaveBeenCalledWith('/api/stock/transfer', {
            from: 'warehouse',
            to: 'warehouse',
            productId: 'p1',
            qty: 3,
            fromWarehouseId: 'w1',
            toWarehouseId: null,
            note: 'نقل',
        });
    });

    test('keeps moveStock on its own endpoint', async () => {
        api.post.mockResolvedValue({});
        await moveStock({ productId: 'p1', qty: 1, type: 'IN' });
        expect(api.post).toHaveBeenCalledWith('/api/stock/move', { productId: 'p1', qty: 1, type: 'IN' });
    });
});
