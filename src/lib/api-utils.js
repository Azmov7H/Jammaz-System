import { NextResponse } from 'next/server';

// Request deduplication map
const pendingRequests = new Map();

/**
 * Generate a unique key for a request
 */
function getRequestKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${url}:${body}`;
}

/**
 * Clean up old pending requests (older than 30 seconds)
 */
function cleanupOldRequests() {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const [key, { timestamp }] of pendingRequests.entries()) {
        if (now - timestamp > timeout) {
            pendingRequests.delete(key);
        }
    }
}

export async function fetcher(url, options = {}) {
    const {
        cache = 'default',
        revalidate = undefined,
        tags = [],
        skipDeduplication = false, // Option to skip deduplication if needed
        ...fetchOptions
    } = options;

    // Ensure credentials are sent by default for API requests
    if (!fetchOptions.credentials) {
        fetchOptions.credentials = 'include';
    }

    // Generate request key for deduplication
    const requestKey = getRequestKey(url, fetchOptions);

    // Check if this request is already pending (only for POST, PUT, DELETE, PATCH)
    const mutationMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const shouldDeduplicate = !skipDeduplication && mutationMethods.includes(fetchOptions.method);

    if (shouldDeduplicate && pendingRequests.has(requestKey)) {
        console.warn(`[API] Duplicate request detected: ${requestKey}`);
        // Return the existing pending promise
        return pendingRequests.get(requestKey).promise;
    }

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    // If cache is explicitly disabled, set headers accordingly
    if (cache === 'no-store' || revalidate === 0) {
        defaultHeaders['Cache-Control'] = 'no-store, no-cache, must-revalidate';
        defaultHeaders['Pragma'] = 'no-cache';
    }

    const headers = { ...defaultHeaders, ...(options.headers || {}) };

    const config = {
        ...fetchOptions,
        headers,
        cache,
        next: {
            revalidate,
            tags,
            ...(fetchOptions.next || {})
        }
    };

    // Create the fetch promise
    const fetchPromise = (async () => {
        try {
            const res = await fetch(url, config);
            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                const error = new Error(errorBody.message || errorBody.error || 'API Request Failed');
                error.status = res.status;
                throw error;
            }
            const data = await res.json();
            return data;
        } finally {
            // Remove from pending requests when done
            if (shouldDeduplicate) {
                pendingRequests.delete(requestKey);
            }
        }
    })();

    // Store the pending request
    if (shouldDeduplicate) {
        pendingRequests.set(requestKey, {
            promise: fetchPromise,
            timestamp: Date.now()
        });
    }

    // Cleanup old requests periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup
        cleanupOldRequests();
    }

    return fetchPromise;
}



export const api = {
    get: (url, options = {}) => fetcher(url, { ...options, method: 'GET' }),
    post: (url, body, options = {}) => fetcher(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
    }),
    put: (url, body, options = {}) => fetcher(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
    }),
    delete: (url, options = {}) => fetcher(url, { ...options, method: 'DELETE' }),
    patch: (url, body, options = {}) => fetcher(url, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body),
    }),
};

