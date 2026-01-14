import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook to prevent multiple simultaneous mutations
 * @returns {Object} - { withLock, isLocked }
 * 
 * @example
 * const { withLock, isLocked } = useMutationLock();
 * 
 * const handleSubmit = () => {
 *   withLock(async () => {
 *     await mutation.mutateAsync(data);
 *   });
 * };
 */
export function useMutationLock() {
    const lockRef = useRef(false);

    const withLock = useCallback(async (mutationFn) => {
        // If already locked, show warning and return
        if (lockRef.current) {
            toast.warning('عملية جارية بالفعل، يرجى الانتظار...');
            return;
        }

        try {
            // Acquire lock
            lockRef.current = true;

            // Execute mutation
            const result = await mutationFn();

            return result;
        } catch (error) {
            // Re-throw error to be handled by caller
            throw error;
        } finally {
            // Always release lock
            lockRef.current = false;
        }
    }, []);

    const isLocked = useCallback(() => {
        return lockRef.current;
    }, []);

    const releaseLock = useCallback(() => {
        lockRef.current = false;
    }, []);

    return {
        withLock,
        isLocked: isLocked(),
        releaseLock
    };
}
