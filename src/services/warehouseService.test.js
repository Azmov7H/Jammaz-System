/**
 * warehouseService unit tests (WH-FE-SVC): endpoint contract + list
 * normalization + delete payload compaction. The `api` client already
 * strips the {success, data} envelope, so we mock it directly.
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
const {
    getWarehouses,
    getPrimaryWarehouse,
    getWarehouse,
    getWarehouseDeletionPreflight,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
} = require('./warehouseService');

beforeEach(() => jest.clearAllMocks());

describe('getWarehouses — list normalization + filter compaction', () => {
    test('normalizes the {warehouses,total} envelope shape', async () => {
        api.get.mockResolvedValue({ warehouses: [{ _id: 'w1' }], total: 9 });
        const res = await getWarehouses();
        expect(api.get).toHaveBeenCalledWith('/api/warehouses', {}, undefined);
        expect(res).toEqual({ warehouses: [{ _id: 'w1' }], total: 9, page: undefined, limit: undefined });
    });

    test('tolerates a legacy bare array response', async () => {
        api.get.mockResolvedValue([{ _id: 'w1' }, { _id: 'w2' }]);
        const res = await getWarehouses();
        expect(res.warehouses).toHaveLength(2);
        expect(res.total).toBe(2);
    });

    test('drops empty/all filters and forwards real ones', async () => {
        api.get.mockResolvedValue({ warehouses: [], total: 0 });
        await getWarehouses({ search: 'مخزن', isActive: 'all', page: 2, limit: 20 });
        expect(api.get).toHaveBeenCalledWith(
            '/api/warehouses',
            { search: 'مخزن', page: 2, limit: 20 },
            undefined
        );
    });
});

describe('single-warehouse reads', () => {
    test('getPrimaryWarehouse hits the /primary endpoint', async () => {
        api.get.mockResolvedValue({ _id: 'p', isPrimary: true });
        const res = await getPrimaryWarehouse();
        expect(api.get).toHaveBeenCalledWith('/api/warehouses/primary', undefined, undefined);
        expect(res._id).toBe('p');
    });

    test('getPrimaryWarehouse returns null when backend returns nothing', async () => {
        api.get.mockResolvedValue(null);
        expect(await getPrimaryWarehouse()).toBeNull();
    });

    test('getWarehouseDeletionPreflight defaults to blocked on empty response', async () => {
        api.get.mockResolvedValue(undefined);
        const res = await getWarehouseDeletionPreflight('w1');
        expect(api.get).toHaveBeenCalledWith('/api/warehouses/w1/deletion-preflight', undefined, undefined);
        expect(res).toEqual({ canDelete: false, reason: 'PRIMARY' });
    });
});

describe('write operations', () => {
    test('createWarehouse posts the payload', async () => {
        api.post.mockResolvedValue({ _id: 'w1' });
        await createWarehouse({ name: 'مخزن', code: 'WH-1' });
        expect(api.post).toHaveBeenCalledWith('/api/warehouses', { name: 'مخزن', code: 'WH-1' });
    });

    test('updateWarehouse puts to the id-scoped URL', async () => {
        api.put.mockResolvedValue({ _id: 'w1' });
        await updateWarehouse('w1', { name: 'جديد' });
        expect(api.put).toHaveBeenCalledWith('/api/warehouses/w1', { name: 'جديد' });
    });

    test('deleteWarehouse omits destination/confirm when deleting an empty warehouse', async () => {
        api.delete.mockResolvedValue({ deleted: true });
        await deleteWarehouse('w1');
        expect(api.delete).toHaveBeenCalledWith('/api/warehouses/w1', { body: JSON.stringify({}) });
    });

    test('deleteWarehouse forwards destination + confirmed when relocating stock', async () => {
        api.delete.mockResolvedValue({ deleted: true });
        await deleteWarehouse('w1', { destinationWarehouseId: 'w2', confirmed: true });
        const [, opts] = api.delete.mock.calls[0];
        expect(JSON.parse(opts.body)).toEqual({ destinationWarehouseId: 'w2', confirmed: true });
    });
});
