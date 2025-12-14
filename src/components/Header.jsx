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
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border shadow-sm flex items-center justify-between px-4 md:px-6">
            {/* Right section: Menu toggle + Search */}
            <div className="flex items-center gap-3 flex-1">
                {/* Mobile menu toggle */}
                {isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="shrink-0"
                    >
                        <Menu size={20} />
                    </Button>
                )}

                {/* Search bar - hidden on mobile */}
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                        type="text"
                        placeholder="بحث سريع..."
                        className="w-full pr-10 bg-muted/50 border-none focus-visible:ring-primary"
                    />
                </div>
            </div>

            {/* Left section: Theme + Notifications + User + Logout */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Theme toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <NotificationPopover />

                {/* Separator */}
                <Separator orientation="vertical" className="h-8 hidden md:block" />

                {/* User info */}
                <div className="flex items-center gap-3">
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-semibold text-foreground">{user?.name || 'مستخدم'}</p>
                        <p className="text-xs text-muted-foreground">{user?.role || ''}</p>
                    </div>
                    <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={user?.picture} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {user?.name?.charAt(0) || 'م'}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Logout button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="تسجيل الخروج"
                >
                    <LogOut size={18} />
                </Button>
            </div>
        </header>
    );
}
