'use client';

import { LogOut, Search, Menu, Bell, User, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNotificationCenter } from '@/context/NotificationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useSidebar } from '@/providers/SidebarProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Header() {
    const router = useRouter();
    const { user } = useUserRole();
    const { toggleSidebar, isMobile } = useSidebar();
    const { setIsSidebarOpen } = useNotificationCenter();
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <header className="sticky top-0 z-40 h-16 sm:h-20 w-full flex items-center justify-between px-4 sm:px-6 transition-all duration-300">
            {/* Background Layer with subtle border bottom */}
            <div className="absolute inset-0 bg-background/40 backdrop-blur-2xl border-b border-white/5 shadow-sm" />

            <div className="relative z-10 w-full flex items-center justify-between">
                {/* Right Section: Mobile Menu + Advanced Search */}
                <div className="flex items-center gap-6 flex-1 max-w-2xl">
                    {isMobile && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleSidebar}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                        >
                            <Menu size={20} className="group-hover:text-primary transition-colors" />
                        </motion.button>
                    )}

                    {!isMobile && (
                        <div className="relative w-full group">
                            <motion.div
                                animate={isSearchFocused ? { scale: 1.02 } : { scale: 1 }}
                                className={cn(
                                    "flex items-center h-12 bg-white/5 border border-white/10 rounded-[1.25rem] px-4 transition-all duration-300",
                                    isSearchFocused ? "bg-white/10 border-primary/30 shadow-[0_0_20px_-10px_var(--primary)] ring-4 ring-primary/5" : "hover:border-white/20"
                                )}
                            >
                                <Search size={18} className={cn("transition-colors", isSearchFocused ? "text-primary" : "text-muted-foreground")} />
                                <Input
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    placeholder="ابحث عن أي شيء... (P)"
                                    className="bg-transparent border-none focus-visible:ring-0 text-sm font-medium w-full h-full placeholder:text-muted-foreground/50 pr-3"
                                />
                                <div className="flex items-center gap-1.5 ml-1 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                                    <span className="text-[10px] font-black text-muted-foreground font-sans">CMD</span>
                                    <span className="text-[10px] font-black text-muted-foreground font-sans">P</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Left Section: Controls & Profile */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl">
                        <ThemeToggle />
                        <NotificationBell onClick={() => setIsSidebarOpen(true)} />
                    </div>

                    <Separator orientation="vertical" className="h-8 bg-white/10 hidden sm:block" />

                    <div className="flex items-center gap-4 group cursor-pointer p-1.5 pr-4 bg-white/5 hover:bg-white/10 border border-white/5 transition-all rounded-[1.5rem]">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{user?.name}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.role}</span>
                        </div>

                        <div className="relative">
                            <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background group-hover:ring-primary/50 transition-all">
                                <AvatarImage src={user?.picture} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-bold">
                                    {user?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-lg" />
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="h-10 w-10 hidden sm:flex rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                            <LogOut size={18} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Top Line Progress Indicator (Fake) */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </header>
    );
}
