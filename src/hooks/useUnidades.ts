import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Unidade {
    id: number;
    nome: string;
    cidade: string;
    uf: string;
    ativo: boolean;
    total_convenios: number;
}

async function fetchUnidades(): Promise<Unidade[]> {
    const { data } = await api.get<Unidade[]>('/unidades');
    return data;
}

export function useUnidades() {
    return useQuery({
        queryKey: ['unidades'],
        queryFn: fetchUnidades,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}

export function useCreateUnidade() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: Partial<Unidade>) => api.post('/unidades', body).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unidades'] }),
    });
}

export function useUpdateUnidade() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...body }: Partial<Unidade> & { id: number }) =>
            api.put(`/unidades/${id}`, body).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unidades'] }),
    });
}

export function useDeleteUnidade() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/unidades/${id}`).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unidades'] }),
    });
}
