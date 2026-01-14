import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook to prevent rapid button clicks (debouncing)
 * @param {number} delay - Delay in milliseconds before button can be clicked again (default: 500ms)
 * @returns {Object} - { isDebouncing, debounce }
 * 
 * @example
 * const { isDebouncing, debounce } = useButtonDebounce(500);
 * 
 * <Button 
 *   onClick={() => debounce(() => handleSubmit())}
 *   disabled={isDebouncing || isPending}
 * >
 *   Submit
 * </Button>
 */
export function useButtonDebounce(delay = 500) {
    const [isDebouncing, setIsDebouncing] = useState(false);
    const timeoutRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debounce = useCallback((callback) => {
        // If already debouncing, ignore the click
        if (isDebouncing) {
            return;
        }

        // Set debouncing state to true
        setIsDebouncing(true);

        // Execute the callback immediately
        callback();

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set timeout to reset debouncing state
        timeoutRef.current = setTimeout(() => {
            setIsDebouncing(false);
        }, delay);
    }, [isDebouncing, delay]);

    const reset = useCallback(() => {
        setIsDebouncing(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    return {
        isDebouncing,
        debounce,
        reset
    };
}
