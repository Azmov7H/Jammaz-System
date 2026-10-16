/**
 * Warehouse Service — owns the /api/warehouses endpoint contract.
 * UI/hooks must not hardcode these URLs (FE-DATA-005, D2/D10).
 *
 * The api client already strips the {success, data} envelope, so every
 * function below works with the bare payload. List shapes are normalized
 * (tolerating legacy bare-array / {data} wrappers) so consumers always get
 * a predictable value.
 */
import { api } from '@/lib/api-utils';

/**
 * @typedef {Object} Warehouse
 * @property {string} _id
 * @property {string} name
 * @property {string} code
 * @property {string} [address]
 * @property {boolean} isPrimary
 * @property {boolean} isActive
 */

/** @returns {{warehouses: Warehouse[], total: number, page?: number, limit?: number}} */
function normalizeList(res) {
    if (Array.isArray(res)) return { warehouses: res, total: res.length };
    const list = res?.warehouses ?? res?.data ?? [];
    return {
        warehouses: Array.isArray(list) ? list : [],
        total: Number(res?.total ?? (Array.isArray(list) ? list.length : 0)) || 0,
        page: res?.page,
        limit: res?.limit
    };
}

/**
 * @param {{search?: string, isActive?: boolean|string, page?: number, limit?: number}} [filters]
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{warehouses: Warehouse[], total: number}>}
 */
export const getWarehouses = async (filters = {}, options) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.isActive !== undefined && filters.isActive !== null && filters.isActive !== 'all') {
        params.isActive = filters.isActive;
    }
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    const res = await api.get('/api/warehouses', params, options);
    return normalizeList(res);
};

/** @param {{signal?: AbortSignal}} [options] @returns {Promise<Warehouse|null>} the primary warehouse */
export const getPrimaryWarehouse = async (options) => {
    const res = await api.get('/api/warehouses/primary', undefined, options);
    return res ?? null;
};

/**
 * @param {string} id
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<Warehouse|null>}
 */
export const getWarehouse = async (id, options) => {
    const res = await api.get(`/api/warehouses/${id}`, undefined, options);
    return res ?? null;
};

/**
 * Pre-flight describing whether a warehouse can be deleted and what the UI
 * must collect (destination warehouse + confirmation) before proceeding.
 * @param {string} id
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{
 *   canDelete: boolean, reason: 'PRIMARY'|null, isPrimary?: boolean,
 *   requiresDestination?: boolean, requiresConfirmation?: boolean,
 *   totalUnits?: number, affectedProducts?: number,
 *   blockedByPurchaseOrders?: boolean, openPurchaseOrders?: number,
 *   availableDestinations?: Warehouse[]
 * }>}
 */
export const getWarehouseDeletionPreflight = async (id, options) => {
    const res = await api.get(`/api/warehouses/${id}/deletion-preflight`, undefined, options);
    return res ?? { canDelete: false, reason: 'PRIMARY' };
};

/**
 * @param {{name: string, code: string, address?: string}} data
 * @returns {Promise<Warehouse>}
 */
export const createWarehouse = (data) => api.post('/api/warehouses', data);

/**
 * @param {string} id
 * @param {{name?: string, code?: string, address?: string, isActive?: boolean}} data
 * @returns {Promise<Warehouse>}
 */
export const updateWarehouse = (id, data) => api.put(`/api/warehouses/${id}`, data);

/**
 * Delete a warehouse. When it holds stock the backend requires a
 * destinationWarehouseId and confirmed=true (surfaced as a 409 otherwise).
 * @param {string} id
 * @param {{destinationWarehouseId?: string, confirmed?: boolean}} [payload]
 * @returns {Promise<{deleted: boolean, warehouseId: string, relocatedUnits: number, affectedProducts: number, destinationWarehouseId: string|null}>}
 */
export const deleteWarehouse = (id, payload = {}) =>
    api.delete(`/api/warehouses/${id}`, {
        body: JSON.stringify({
            ...(payload.destinationWarehouseId ? { destinationWarehouseId: payload.destinationWarehouseId } : {}),
            ...(payload.confirmed ? { confirmed: true } : {})
        })
    });

/** Legacy namespace kept for existing consumers. */
export const WarehouseService = {
    list: getWarehouses,
    getPrimary: getPrimaryWarehouse,
    getById: getWarehouse,
    deletionPreflight: getWarehouseDeletionPreflight,
    create: createWarehouse,
    update: updateWarehouse,
    remove: deleteWarehouse
};
