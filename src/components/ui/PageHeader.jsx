'use client';

import * as React from 'react';
import { cn } from '@/utils';

export function PageHeader({
    title,
    subtitle,
    icon: Icon,
    actions,
    gradient = true,
    className
}) {
    return (
        <div className={cn("flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-8", className)}>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                            <Icon className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                    )}
                    <div>
                        <h1 className={cn(
                            "text-4xl md:text-5xl font-black tracking-tighter",
                            gradient
                                ? "bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent"
                                : "text-foreground"
                        )}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-muted-foreground font-bold text-lg mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
