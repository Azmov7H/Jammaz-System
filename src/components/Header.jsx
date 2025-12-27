'use client';

import { LogOut, Search, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import NotificationPopover from '@/components/NotificationPopover';
import { useUserRole } from '@/hooks/useUserRole';
import { useSidebar } from '@/providers/SidebarProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function Header() {
    const router = useRouter();
    const { user } = useUserRole();
    const { toggleSidebar, isMobile } = useSidebar();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <header className="sticky top-0 z-30 h-16 glass-header shadow-custom-md flex items-center justify-between px-4 md:px-6 animate-fade-in-up">
            {/* Right section: Menu toggle + Search */}
            <div className="flex items-center gap-3 flex-1">
                {/* Mobile menu toggle */}
                {isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="shrink-0 hover-scale hover:bg-primary/10 transition-all duration-300"
                    >
                        <Menu size={20} />
                    </Button>
                )}

                {/* Search bar - hidden on mobile */}
                <div className="relative w-full max-w-md hidden md:block group">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors duration-300" size={18} />
                    <Input
                        type="text"
                        placeholder="بحث سريع..."
                        className="w-full pr-10 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-2 focus-visible:shadow-colored transition-all duration-300 hover:bg-muted/70"
                    />
                </div>
            </div>

            {/* Left section: Theme + Notifications + User + Logout */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Theme toggle */}
                <div className="hover-scale">
                    <ThemeToggle />
                </div>

                {/* Notifications */}
                <div className="hover-scale">
                    <NotificationPopover />
                </div>

                {/* Separator */}
                <Separator orientation="vertical" className="h-8 hidden md:block bg-border/50" />

                {/* User info */}
                <div className="flex items-center gap-3 cursor-pointer hover-scale group">
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{user?.name || 'مستخدم'}</p>
                        <p className="text-xs text-muted-foreground">{user?.role || ''}</p>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-primary/20 group-hover:border-primary group-hover:shadow-colored transition-all duration-300">
                        <AvatarImage src={user?.picture} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                            {user?.name?.charAt(0) || 'م'}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Logout button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover-scale transition-all duration-300"
                    title="تسجيل الخروج"
                >
                    <LogOut size={18} />
                </Button>
            </div>
        </header>
    );
}
