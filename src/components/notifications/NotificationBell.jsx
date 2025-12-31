'use client';

import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCenter } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function NotificationBell() {
    const { unreadCount } = useNotifications();
    const { setIsSidebarOpen } = useNotificationCenter();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="relative group hover:bg-primary/10 transition-all duration-300 rounded-2xl active:scale-90"
        >
            <Bell size={22} className="text-foreground/60 group-hover:text-primary transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />

            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1"
                    >
                        <div className="relative">
                            <motion.div
                                className="absolute inset-0 bg-primary/40 rounded-full blur-md"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <Badge className="relative h-5 min-w-[20px] flex items-center justify-center p-0 px-1.5 text-[10px] font-black bg-gradient-to-br from-primary via-purple-600 to-primary border-2 border-background shadow-lg shadow-primary/40">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Button>
    );
}
