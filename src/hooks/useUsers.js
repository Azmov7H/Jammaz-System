import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-utils';
import { toast } from 'sonner';

export function useUsers() {
    const queryClient = useQueryClient();

    const usersQuery = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/api/users');
            return res.data;
        },
    });

    const createUserMutation = useMutation({
        mutationFn: (data) => api.post('/api/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم إضافة المستخدم بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, ...data }) => api.put(`/api/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم تحديث المستخدم بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم حذف المستخدم بنجاح');
        },
        onError: (error) => toast.error(error.message)
    });

    return {
        users: usersQuery.data?.users || [],
        isLoading: usersQuery.isLoading,
        createUser: createUserMutation,
        updateUser: updateUserMutation,
        deleteUser: deleteUserMutation
    };
}
