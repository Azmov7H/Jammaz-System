'use client';

import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

/**
 * Unified Error State Component
 * Use this for consistent error display and "try again" actions
 */
export function ErrorState({
    title = 'حدث خطأ ما',
    message = 'تعذر تحميل البيانات. يرجى المحاولة مرة أخرى.',
    onRetry,
    className
}) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-4 py-12 text-center",
            className
        )}>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">{message}</p>
            </div>

            {onRetry && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="gap-2 mt-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    إعادة المحاولة
                </Button>
            )}
        </div>
    );
}

/**
 * Table Error State - for use inside table bodies
 */
export function TableErrorState({
    colSpan = 6,
    message,
    onRetry
}) {
    return (
        <tr>
            <td colSpan={colSpan} className="h-64 text-center border-none">
                <ErrorState message={message} onRetry={onRetry} />
            </td>
        </tr>
    );
}
