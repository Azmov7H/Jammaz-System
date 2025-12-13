export const ROLES = {
    OWNER: 'owner',
    MANAGER: 'manager',
    CASHIER: 'cashier',
    WAREHOUSE: 'warehouse',
    VIEWER: 'viewer'
};

export const PERMISSIONS = {
    [ROLES.OWNER]: ['*'], // Full Access
    [ROLES.MANAGER]: [
        'dashboard:view',
        'products:manage',
        'stock:manage',
        'invoices:manage',
        'financial:view',
        'financial:manage',
        'reports:view',
        'suppliers:manage',
        'transfers:manage',
        'users:manage',
        'activity:view',
        'settings:manage'
    ],
    [ROLES.CASHIER]: [
        'dashboard:view',
        'invoices:create',
        'invoices:view',
        'products:view',
        'products:read_stock'
    ],
    [ROLES.WAREHOUSE]: [
        'dashboard:view',
        'stock:manage',
        'transfers:manage',
        'products:view',
        'audit:manage'
    ],
    [ROLES.VIEWER]: [
        'dashboard:view',
        'products:view',
        'stock:view_only',
        'reports:view'
    ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
    if (!role) return false;
    if (role === 'owner') return true;

    const rolePermissions = PERMISSIONS[role] || [];
    if (rolePermissions.includes('*')) return true;

    return rolePermissions.includes(permission);
}

/**
 * Get authorized product query filter based on role
 * @param {string} role 
 * @returns {object} Mongoose filter object
 */
export function getProductFilterInternal(role) {
    if (role === 'owner' || role === 'manager') return {}; // All products
    if (role === 'warehouse') return {}; // Warehouse sees all? Or maybe just warehouse? Usually all to know what's coming.
    if (role === 'cashier') return { shopQty: { $gt: -1 } }; // Cashier needs to see shop products.
    return {};
}
