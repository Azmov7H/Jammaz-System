import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/lib/permissions';
import { useSidebar } from '@/providers/SidebarProvider';
import { navigationConfig } from '@/config/navigation';
import { api } from '@/lib/api-utils';

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
        try {
            await api.post('/api/auth/logout');
            window.location.href = '/login';
        } catch (err) {
            console.error('Logout failed:', err);
            window.location.href = '/login';
        }
    };

    const sidebarWidth = useMemo(() => {
        if (isMobile) return '100vw';
        return isOpen ? 280 : 80;
    }, [isOpen, isMobile]);

    const filteredNavigation = useMemo(() => {
        // If loading, returning empty array hides sidebar. 
        // Better to return the config but marked as loading, or just return it and let UI handle skeleton.
        // For now, if loading we return the full config but maybe disable links? 
        // Or just let it be empty?
        // Actually, returning [] causes "Sidebar content missing". 
        // Let's return the full config if role is not yet determined but don't filter strictly yet?
        // No, security first. 
        // If loading is true, we should probably return a skeleton structure or Wait.
        // But the previous issue was `role` being undefined FOREVER. 

        if (loading) return [];
        if (!role) return []; // If loaded but no role (not logged in), return empty.

        return navigationConfig.map(group => ({
            ...group,
            items: group.items.filter(item => isAllowed(item, role))
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
