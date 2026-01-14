'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function SidebarItem({
    icon: Icon,
    label,
    href,
    isActive,
    isCollapsed,
    onClick,
    badge
}) {
    const content = (
        <Link
            href={href}
            prefetch={true}
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
        >
            <div className={cn(
                "flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                isCollapsed ? "w-full" : "w-6"
            )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>

            {!isCollapsed && (
                <span className={cn(
                    "text-sm font-bold tracking-tight whitespace-nowrap transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-90 group-hover:opacity-100"
                )}>
                    {label}
                </span>
            )}

            {!isCollapsed && badge && (
                <span className="mr-auto px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-black uppercase">
                    {badge}
                </span>
            )}

            {isActive && !isCollapsed && (
                <motion.div
                    layoutId="active-indicator"
                    className="absolute right-0 top-2 bottom-2 w-1.5 bg-secondary rounded-l-full shadow-[0_0_10px_rgba(var(--secondary),0.5)]"
                />
            )}
        </Link>
    );

    if (isCollapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {content}
                </TooltipTrigger>
                <TooltipContent side="left" className="font-bold">
                    {label}
                </TooltipContent>
            </Tooltip>
        );
    }

    return content;
}
