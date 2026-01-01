'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Sparkles,
    Loader2
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/lib/permissions';
import { useSidebar } from '@/providers/SidebarProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SidebarItem } from './sidebar/SidebarItem';
import { SidebarGroup } from './sidebar/SidebarGroup';
import { navigationConfig } from '@/config/navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const { role, user, loading } = useUserRole();
    const { isOpen, toggleSidebar, isMobile, closeSidebar } = useSidebar();

    const isAllowed = (item) => {
        if (loading) return true; // Show while loading, Skeleton will handle visual
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

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSidebar}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Shell */}
            <motion.aside
                initial={isMobile ? { x: '100%' } : false}
                animate={isMobile ? { x: isOpen ? 0 : '100%' } : { width: sidebarWidth }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={cn(
                    "relative h-screen flex flex-col z-50 overflow-hidden shrink-0",
                    isMobile ? "fixed inset-y-0 right-0 max-w-[300px] w-full" : "sticky top-0",
                    "bg-card/95 backdrop-blur-2xl border-l border-white/5 shadow-2xl"
                )}
            >
                {/* Header: Logo & Toggle */}
                <div className={cn(
                    "h-20 flex items-center px-6 shrink-0 border-b border-white/5 relative",
                    !isOpen && !isMobile && "justify-center px-0"
                )}>
                    {isOpen || isMobile ? (
                        <div className="flex items-center gap-3 group px-1">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary/60 rounded-xl flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-300">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black tracking-tight text-foreground">
                                    مخازن الجماز
                                </span>
                                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
                                    Evolution v2.5
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    )}

                    {!isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className={cn(
                                "absolute -left-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background border border-white/10 shadow-lg hover:bg-primary hover:text-white transition-all z-10",
                                !isOpen && "left-0 right-0 mx-auto -bottom-4 top-auto translate-y-0"
                            )}
                        >
                            {isOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                        </Button>
                    )}
                </div>

                {/* Navigation Content */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-6 px-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((j) => (
                                                <div key={j} className="h-10 w-full bg-muted/40 animate-pulse rounded-xl" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            navigationConfig.map((group) => {
                                const allowedItems = group.items.filter(isAllowed);
                                if (allowedItems.length === 0) return null;

                                return (
                                    <SidebarGroup
                                        key={group.title}
                                        title={group.title}
                                        isCollapsed={!isOpen && !isMobile}
                                    >
                                        <div className="space-y-1 mt-1">
                                            {allowedItems.map((item) => (
                                                <SidebarItem
                                                    key={item.href}
                                                    icon={item.icon}
                                                    label={item.name}
                                                    href={item.href}
                                                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                                                    isCollapsed={!isOpen && !isMobile}
                                                    onClick={() => isMobile && closeSidebar()}
                                                />
                                            ))}
                                        </div>
                                    </SidebarGroup>
                                );
                            })
                        )}

                        {/* Fallback if no allowed items found for non-loading state */}
                        {!loading && navigationConfig.every(g => g.items.filter(isAllowed).length === 0) && (
                            <div className="py-10 text-center px-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    لا توجد صلاحيات وصول
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer: User Profile */}
                <div className="p-3 mt-auto border-t border-white/5 bg-white/5">
                    <div className={cn(
                        "flex items-center gap-3 p-2 rounded-2xl transition-all duration-300",
                        isOpen || isMobile ? "bg-white/5" : "justify-center"
                    )}>
                        <div className="relative shrink-0">
                            <Avatar className="h-10 w-10 border-2 border-primary/20 ring-2 ring-primary/5 shadow-inner">
                                <AvatarImage src={user?.picture} />
                                <AvatarFallback className="bg-primary text-white font-black">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : user?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            {!loading && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card shadow-sm" />}
                        </div>

                        {(isOpen || isMobile) && (
                            <div className="flex-1 min-w-0 pr-1">
                                <p className="text-xs font-black text-foreground truncate">
                                    {loading ? 'جاري التحميل...' : user?.name}
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {getRoleDisplay()}
                                </p>
                            </div>
                        )}

                        {(isOpen || isMobile) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                                <LogOut size={14} />
                            </Button>
                        )}
                    </div>

                    {!isOpen && !isMobile && (
                        <div className="flex justify-center mt-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                                <LogOut size={14} />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            </motion.aside>
        </>
    );
}

