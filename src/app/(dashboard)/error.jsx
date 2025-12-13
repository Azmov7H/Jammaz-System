'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-destructive/10 p-4 text-destructive">
                    <AlertCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">حدث خطأ ما!</h2>
                <p className="text-muted-foreground">
                    نعتذر، واجه النظام مشكلة غير متوقعة.
                </p>
                <p className="text-sm text-muted-foreground/80 font-mono bg-muted p-2 rounded max-w-md overflow-auto">
                    {error.message || 'Unknown Error'}
                </p>
            </div>
            <Button onClick={() => reset()} variant="default">
                حاول مرة أخرى
            </Button>
        </div>
    );
}
