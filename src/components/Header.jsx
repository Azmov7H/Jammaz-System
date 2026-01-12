'use client';


import {
    Search, Bell, LogOut, Settings,
    Menu, Sun, Moon, Sparkles, Command,
    UserCircle, ShieldCheck
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useHeader } from '@/hooks/useHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { useNotificationCenter } from '@/context/NotificationContext';
import { useNotifications } from '@/hooks/useNotifications';
import { motion } from 'framer-motion';

function NotificationTrigger() {
    const { setIsSidebarOpen } = useNotificationCenter();
    const { unreadCount } = useNotifications();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-xl hover:bg-white/10 relative h-10 w-10 group"
        >
            <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
                <span className="absolute top-2.5 left-2.5 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-background animate-pulse" />
            )}
        </Button>
    );
}

export default function Header() {
    const {
        theme, setTheme,
        toggleSidebar,
        user, role, loading,
        scrolled, mounted,
        handleLogout
    } = useHeader();

    if (!mounted) return null;

    return (
        <header className={cn(
            "sticky top-0 z-40 h-20 transition-all duration-500",
            "bg-background/40 backdrop-blur-xl border-b border-white/5",
            scrolled && "shadow-custom-lg bg-background/60"
        )}>
            <div className="container h-full mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
                {/* Mobile Menu & Search */}
                <div className="flex items-center gap-4 flex-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                        onClick={toggleSidebar}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <div className="hidden md:flex relative group max-w-sm w-full">
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                            <Search className="h-4 w-4" />
                        </div>
                        <Input
                            placeholder="بحث سريعة (Ctrl+K)"
                            className="bg-white/5 border-white/10 pr-10 h-10 rounded-xl focus-visible:ring-primary/30 focus-visible:bg-white/10 transition-all font-bold"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-bold text-muted-foreground">
                            <Command className="w-3 h-3" />
                            <span>K</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="rounded-xl hover:bg-white/10 transition-all h-10 w-10 relative overflow-hidden group"
                    >
                        <motion.div
                            initial={false}
                            animate={{ rotate: theme === 'dark' ? 0 : 90, scale: theme === 'dark' ? 0 : 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <Sun className="h-5 w-5 text-amber-500" />
                        </motion.div>
                        <motion.div
                            initial={false}
                            animate={{ rotate: theme === 'dark' ? 0 : -90, scale: theme === 'dark' ? 1 : 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <Moon className="h-5 w-5 text-primary" />
                        </motion.div>
                    </Button>

                    {/* Notifications */}
                    <NotificationTrigger />

                    {/* User Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-12 pr-1 pl-4 rounded-2xl hover:bg-white/5 transition-all gap-3 border border-transparent hover:border-white/10">
                                <div className="flex flex-col items-end hidden lg:flex">
                                    <span className="text-xs font-black text-foreground truncate max-w-[100px]">
                                        {loading ? '...' : user?.name}
                                    </span>
                                    <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">
                                        {role === 'owner' ? 'المالك' : 'مستخدم'}
                                    </span>
                                </div>
                                <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-xl group-hover:scale-110 transition-transform">
                                    <AvatarImage src={user?.picture} />
                                    <AvatarFallback className="bg-gradient-to-tr from-primary to-primary/60 text-white font-black">
                                        {user?.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[240px] rounded-2xl p-2 bg-popover/80 backdrop-blur-2xl border-white/10">
                            <DropdownMenuLabel className="p-3">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-black text-sm">{user?.name}</span>
                                    <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{user?.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="rounded-xl font-bold gap-3 p-3">
                                <UserCircle className="w-4 h-4 text-primary" />
                                <span>الملف الشخصي</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold gap-3 p-3">
                                <Settings className="w-4 h-4 text-secondary" />
                                <span>إعدادات النظام</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                                className="rounded-xl font-bold gap-3 p-3 text-rose-500 hover:text-rose-600 focus:bg-rose-500/10 focus:text-rose-500"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                <span>تسجيل الخروج</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {/* Top Line Progress Indicator (Secondary) */}
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </header>
    );
}
