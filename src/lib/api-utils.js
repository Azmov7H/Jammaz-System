export async function fetcher(url, options = {}) {
    const {
        cache = 'default',
        revalidate = undefined,
        tags = [],
        ...fetchOptions
    } = options;

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

    const res = await fetch(url, config);
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const error = new Error(errorBody.error || 'API Request Failed');
        error.status = res.status;
        throw error;
    }
    return res.json();
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
};
