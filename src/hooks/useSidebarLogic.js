import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/lib/permissions';
import { useSidebar } from '@/providers/SidebarProvider';
import { navigationConfig } from '@/config/navigation';

export function useSidebarLogic() {
    const pathname = usePathname();
    const { role, user, loading } = useUserRole();
    const { isOpen, toggleSidebar, isMobile, closeSidebar } = useSidebar();

    const isAllowed = (item) => {
        if (loading) return true; // Show while loading
        if (!role) return false;
        if (role === 'owner') return true;
        if (!item.permission) return true;
        return hasPermission(role, item.permission);
    };

    const getRoleDisplay = () => {
        if (loading) return 'جاري التحميل...';
        switch (role) {
            case 'owner': return 'المالك';
            case 'manager': return 'مدير فرع';
            case 'cashier': return 'كاشير';
            case 'warehouse': return 'أمين مستودع';
            default: return 'مستخدم';
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    const sidebarWidth = useMemo(() => {
        if (isMobile) return '100vw';
        return isOpen ? 280 : 80;
    }, [isOpen, isMobile]);

    const filteredNavigation = useMemo(() => {
        if (loading) return [];
        return navigationConfig.map(group => ({
            ...group,
            items: group.items.filter(isAllowed)
        })).filter(group => group.items.length > 0);
    }, [navigationConfig, role, loading]);

    return {
        role,
        user,
        loading,
        isOpen,
        toggleSidebar,
        isMobile,
        closeSidebar,
        isAllowed,
        getRoleDisplay,
        handleLogout,
        sidebarWidth,
        filteredNavigation,
        pathname
    };
}
