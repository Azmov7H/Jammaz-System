'use client';

import { useState, useEffect } from 'react';
import { LogOut, Bell, Search, User, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import Sidebar from '@/components/Sidebar';

export default function Header() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            })
            .catch(err => console.error(err));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <header className="h-16 bg-card border-b border-border shadow-sm flex items-center justify-between px-6 z-10 transition-colors duration-300">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors">
                                <Menu size={24} />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 border-l border-border bg-primary w-72">
                            <Sidebar isMobile={true} />
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="relative w-full max-w-xs hidden md:block">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="بحث سريع..."
                        className="w-full pl-4 pr-10 py-2 bg-muted/50 border-none rounded-lg focus:ring-2 focus:ring-primary/50 text-sm outline-none transition-all text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />

                <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-card"></span>
                </button>

                <div className="h-8 w-[1px] bg-border mx-1 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-semibold text-foreground">{user?.name || 'مستخدم'}</p>
                        <p className="text-xs text-muted-foreground">{user?.role || ''}</p>
                    </div>
                    {user?.picture ? (
                        <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-border" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User size={20} />
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-2"
                    title="تسجيل الخروج"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
