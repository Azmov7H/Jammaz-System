import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Standard hook for managing search, pagination, and basic filtering.
 * Automates common patterns like resetting page on search change.
 */
export function useFilters(initialLimit = 50) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(initialLimit);

    const debouncedSearch = useDebounce(search, 500);

    // Reset page to 1 when search or filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filter]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    return {
        search, setSearch,
        filter, setFilter,
        page, setPage,
        limit, setLimit,
        debouncedSearch,
        handleSearch,
        // Common param object for queries
        queryContext: {
            page,
            limit,
            ...(debouncedSearch ? { search: debouncedSearch } : {})
        }
    };
}
