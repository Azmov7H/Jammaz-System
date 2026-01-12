'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

export function SidebarGroup({ title, children, isCollapsed, defaultExpanded = true }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center gap-2 py-4 border-t border-white/5 first:border-t-0">
                {children}
            </div>
        );
    }

    return (
        <div className="space-y-1 py-4 first:pt-0 border-t border-white/5 first:border-t-0">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 group hover:bg-muted/30 rounded-lg transition-colors"
            >
                <span className="text-[10px] font-black text-muted-foreground group-hover:text-foreground tracking-widest uppercase transition-colors">
                    {title}
                </span>
                <ChevronRight
                    size={14}
                    className={cn(
                        "text-muted-foreground transition-transform duration-300",
                        isExpanded && "rotate-90 text-primary"
                    )}
                />
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'circOut' }}
                        className="overflow-hidden space-y-1"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
