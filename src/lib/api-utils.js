export async function fetcher(url, options = {}) {
    const defaultHeaders = {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
    };

    // Merge headers if options.headers exists
    const headers = { ...defaultHeaders, ...(options.headers || {}) };

    const res = await fetch(url, { ...options, headers, cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const error = new Error(errorBody.error || 'API Request Failed');
        error.status = res.status;
        throw error;
    }
    return res.json();
}

export const api = {
    get: (url) => fetcher(url),
    post: (url, body) => fetcher(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }),
    put: (url, body) => fetcher(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }),
    delete: (url) => fetcher(url, { method: 'DELETE' }),
};
