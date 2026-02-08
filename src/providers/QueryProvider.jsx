'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load devtools - only included in development bundle
const ReactQueryDevtools = dynamic(
    () => import('@tanstack/react-query-devtools').then(mod => mod.ReactQueryDevtools),
    { ssr: false }
);

export default function QueryProvider({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // Data is fresh for 1 minute
                refetchOnWindowFocus: false, // Prevent reload on tab switch for calmer UX
                retry: 3,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}
