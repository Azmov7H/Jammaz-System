'use client';

import * as React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/utils';

/**
 * Unified Loading State Component
 * Use this component for consistent loading states across the app
 */
export function LoadingState({
    message = 'جاري التحميل...',
    size = 'md',
    className
}) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-3 py-12",
            className
        )}>
            <Spinner className={cn("text-primary", sizeClasses[size] || sizeClasses.md)} />
            {message && (
                <p className="text-muted-foreground font-bold text-sm">{message}</p>
            )}
        </div>
    );
}

/**
 * Table Loading State - for use inside table bodies
 */
export function TableLoadingState({
    colSpan = 6,
    message = 'جاري التحميل...'
}) {
    return (
        <tr>
            <td colSpan={colSpan} className="h-64 text-center border-none">
                <LoadingState message={message} />
            </td>
        </tr>
    );
}

/**
 * Full Page Loading State
 */
export function PageLoadingState({ message = 'جاري التحميل...' }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <LoadingState size="lg" message={message} />
        </div>
    );
}
