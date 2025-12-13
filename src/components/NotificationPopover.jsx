'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { toast } from 'sonner';

export default function NotificationPopover() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.notifications.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (ids = 'all') => {
        try {
            const res = await fetch('/api/notifications/mark-read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (res.ok) {
                if (ids === 'all') {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    setUnreadCount(0);
                    toast.success('تم تحديد الكل كمقروء');
                } else {
                    // Single mark read logic if implemented per item
                }
            }
        } catch (error) {
            toast.error('فشل التحديث');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'SUCCESS': return <CheckCircle size={16} className="text-green-500" />;
            case 'ERROR': return <XCircle size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-card animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-2 w-80 bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-xl overflow-hidden z-50 origin-top-left"
                    >
                        <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
                            <h3 className="font-bold text-sm">الإشعارات</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchNotifications}
                                    className="p-1 hover:bg-muted rounded-full text-muted-foreground"
                                    title="تحديث"
                                >
                                    <RefreshCw size={14} className={clsx(loading && "animate-spin")} />
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAsRead('all')}
                                        className="text-xs text-blue-500 hover:text-blue-600 font-medium px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                                    >
                                        قراءة الكل
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                    <p>لا توجد إشعارات جديدة</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            className={clsx(
                                                "p-3 hover:bg-muted/50 transition-colors flex gap-3 text-right",
                                                !notif.isRead && "bg-blue-500/5"
                                            )}
                                        >
                                            <div className="mt-1 shrink-0">
                                                {getTypeIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={clsx("text-sm font-semibold truncate", !notif.isRead ? "text-foreground" : "text-muted-foreground")}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5 break-words leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground/60 mt-2 block">
                                                    {new Date(notif.createdAt).toLocaleDateString('ar-EG', { hour: 'numeric', minute: 'numeric' })}
                                                </span>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
