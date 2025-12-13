'use client';

import { useState, useEffect } from 'react';

export function useUserRole() {
    const [role, setRole] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/auth/session');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setRole(data.user.role);
                        setUser(data.user);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user role:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, []);

    return { role, user, loading };
}

export const PERMISSIONS = {
    owner: ['*'],
    manager: ['/dashboard', '/dashboard/strategy', '/products', '/stock', '/invoices', '/suppliers', '/reports/sales', '/analytics/stock', '/audit', '/logs', '/settings'],
    // Manager has view access to invoices for reporting, but logically Cashier is the primary POS user.
    // However, keeping access broad for Manager is safer. 
    // Let's ensure Warehouse definitely DOES NOT have invoice access.

    cashier: ['/dashboard', '/invoices', '/invoices/new', '/products', '/settings'], // Explicitly added /invoices/new
    warehouse: ['/dashboard', '/stock', '/products', '/audit', '/analytics/stock', '/settings'], // No Invoice access
};
