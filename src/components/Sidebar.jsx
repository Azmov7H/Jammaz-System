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
                    "relative h-screen flex flex-col z-50 overflow-hidden shrink-0 transition-colors duration-500",
                    isMobile ? "fixed inset-y-0 right-0 max-w-[300px] w-full" : "sticky top-0",
                    "bg-card/90 backdrop-blur-3xl border-l border-white/5 shadow-2xl"
                )}
            >
                {/* Header: Logo & Toggle */}
                <div className={cn(
                    "h-20 flex items-center px-6 shrink-0 border-b border-white/5 relative bg-white/[0.02]",
                    !isOpen && !isMobile && "justify-center px-0"
                )}>
                    {isOpen || isMobile ? (
                        <div className="flex items-center gap-3 group px-1">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-primary/60 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-all duration-500">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="absolute inset-0 bg-primary/20 blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/70">
                                    مخازن الجماز
                                </span>
                                <span className="text-[10px] font-black text-primary tracking-widest uppercase opacity-70">
                                    Enterprise Suite
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    )}

                    {!isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className={cn(
                                "absolute -left-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background border border-white/10 shadow-xl hover:bg-primary hover:text-white transition-all z-10",
                                !isOpen && "left-0 right-0 mx-auto -bottom-4 top-auto translate-y-0"
                            )}
                        >
                            {isOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
                        </Button>
                    )}
                </div>

                {/* Navigation Content */}
                <ScrollArea className="flex-1 w-full min-h-0" type="hover">
                    <div className="space-y-6 px-3 py-6">
                        {loading ? (
                            <div className="space-y-6 px-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="h-2 w-16 bg-white/5 animate-pulse rounded" />
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((j) => (
                                                <div key={j} className="h-11 w-full bg-white/5 animate-pulse rounded-xl" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            navigationConfig.map((group, groupIndex) => {
                                const allowedItems = group.items.filter(isAllowed);
                                if (allowedItems.length === 0) return null;

                                return (
                                    <SidebarGroup
                                        key={group.title}
                                        title={group.title}
                                        isCollapsed={!isOpen && !isMobile}
                                    >
                                        <div className="space-y-1.5 mt-2">
                                            {allowedItems.map((item, itemIndex) => {
                                                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                                return (
                                                    <SidebarItem
                                                        key={item.href}
                                                        icon={item.icon}
                                                        label={item.name}
                                                        href={item.href}
                                                        isActive={isActive}
                                                        isCollapsed={!isOpen && !isMobile}
                                                        onClick={() => isMobile && closeSidebar()}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </SidebarGroup>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                {/* Footer: User Profile */}
                <div className="p-4 mt-auto border-t border-white/5 bg-white/[0.01]">
                    <div className={cn(
                        "flex items-center gap-3 p-2 rounded-2xl transition-all duration-500",
                        isOpen || isMobile ? "bg-white/5 hover:bg-white/10" : "justify-center"
                    )}>
                        <div className="relative shrink-0">
                            <Avatar className="h-10 w-10 border-2 border-primary/20 ring-4 ring-primary/5 shadow-2xl transition-transform group-hover:scale-110">
                                <AvatarImage src={user?.picture} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-black">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : user?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            {!loading && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card shadow-lg" />}
                        </div>

                        {(isOpen || isMobile) && (
                            <div className="flex-1 min-w-0 pr-1">
                                <p className="text-[13px] font-black text-foreground truncate leading-tight">
                                    {loading ? 'جاري التحميل...' : user?.name}
                                </p>
                                <p className="text-[9px] font-bold text-primary/80 uppercase tracking-widest mt-0.5">
                                    {getRoleDisplay()}
                                </p>
                            </div>
                        )}

                        {(isOpen || isMobile) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all opacity-60 hover:opacity-100"
                            >
                                <LogOut size={14} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            </motion.aside>
        </>
    );
}

