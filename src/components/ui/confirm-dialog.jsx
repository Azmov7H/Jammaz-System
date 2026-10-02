'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/utils';

/**
 * Themed RTL confirmation dialog for destructive/irreversible actions.
 * Replaces native confirm() across the app (UX-001).
 *
 * Props:
 * - open / onOpenChange: controlled state
 * - title / description: Arabic copy
 * - confirmLabel / cancelLabel: button text
 * - destructive: red styling on the confirm action (default true)
 * - onConfirm: called when the confirm action is pressed
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title = 'تأكيد الإجراء',
    description,
    confirmLabel = 'تأكيد',
    cancelLabel = 'إلغاء',
    destructive = true,
    pending = false,
    onConfirm,
    children,
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent dir="rtl" className="rounded-2xl">
                <AlertDialogHeader className="text-right">
                    <AlertDialogTitle className="font-bold">{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription className="font-medium leading-relaxed">
                            {description}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                {children}
                <AlertDialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start">
                    <AlertDialogCancel className="rounded-xl font-bold">
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            if (pending) e.preventDefault();
                            onConfirm?.(e);
                        }}
                        disabled={pending}
                        className={cn(
                            'rounded-xl font-bold gap-2',
                            destructive && buttonVariants({ variant: 'destructive' })
                        )}
                    >
                        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
