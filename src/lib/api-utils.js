export async function fetcher(url, options = {}) {
    const res = await fetch(url, options);
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
