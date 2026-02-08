/**
 * Custom Error class for Jammaz API interactions
 */
export class JammazApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'JammazApiError';
        this.status = status;
        this.data = data;
    }

    get isValidationError() {
        return this.status === 400;
    }

    get isUnauthorized() {
        return this.status === 401 || this.status === 403;
    }
}

// Request deduplication map
const pendingRequests = new Map();

function getRequestKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${url}:${body}`;
}

export async function fetcher(url, options = {}) {
    const {
        params, // New: Support for query parameters as object
        cache = 'default',
        revalidate = undefined,
        tags = [],
        skipDeduplication = false,
        ...fetchOptions
    } = options;

    let finalUrl = url;

    // 1. Handle Query Parameters
    if (params) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value);
            }
        });
        const queryString = query.toString();
        if (queryString) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
        }
    }

    // 2. Base URL & Environment Handling
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (process.env.NODE_ENV !== 'production' && baseUrl.includes(':5050')) {
        baseUrl = '';
    }

    if (baseUrl && url.startsWith('/') && !url.startsWith('//')) {
        finalUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${finalUrl}`;
    }

    // 3. Request Deduplication
    const requestKey = getRequestKey(finalUrl, fetchOptions);
    const mutationMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const shouldDeduplicate = !skipDeduplication && mutationMethods.includes(fetchOptions.method);

    if (shouldDeduplicate && pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey).promise;
    }

    // 4. Headers & Config
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (cache === 'no-store' || revalidate === 0) {
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    }

    const config = {
        ...fetchOptions,
        headers,
        cache,
        credentials: fetchOptions.credentials || 'include',
        next: {
            revalidate,
            tags,
            ...(fetchOptions.next || {})
        }
    };

    // 5. Execution
    const fetchPromise = (async () => {
        try {
            const res = await fetch(finalUrl, config);

            // Handle Global Auth Failure (401/403)
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== 'undefined') {
                    // Force refresh or redirect to login if session expired
                    // Uncomment when routing is ready: window.location.href = '/login?expired=true';
                }
            }

            let response;
            try {
                response = await res.json();
            } catch (e) {
                response = { success: false, message: 'Invalid JSON response from server' };
            }

            if (!res.ok) {
                throw new JammazApiError(
                    response.message || response.error || 'خطأ في الاتصال بالخادم',
                    res.status,
                    response.data
                );
            }

            // Standardize Response Unwrapping
            if (response && typeof response === 'object' && 'success' in response) {
                if (response.success) {
                    return response.data;
                } else {
                    throw new JammazApiError(response.message || 'API Error', res.status, response.data);
                }
            }

            return response;
        } finally {
            if (shouldDeduplicate) pendingRequests.delete(requestKey);
        }
    })();

    if (shouldDeduplicate) {
        pendingRequests.set(requestKey, { promise: fetchPromise, timestamp: Date.now() });
    }

    return fetchPromise;
}

export const api = {
    get: (url, params, options = {}) => fetcher(url, { ...options, method: 'GET', params }),
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


