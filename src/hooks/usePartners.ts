import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Partner } from '@/types/partner';

interface FetchPartnersParams {
    categoria?: string;
    unidade_id?: number;
    busca?: string;
}

interface PartnersResponse {
    data: Partner[];
    total: number;
    page: number;
    limit: number;
}

async function fetchPartners(params: FetchPartnersParams): Promise<PartnersResponse> {
    const query = new URLSearchParams();
    if (params.categoria) query.set('categoria', params.categoria);
    if (params.unidade_id) query.set('unidade_id', String(params.unidade_id));
    if (params.busca) query.set('busca', params.busca);

    const { data } = await api.get<PartnersResponse>(`/convenios?${query.toString()}`);
    return data;
}

export function usePartners(params: FetchPartnersParams = {}) {
    return useQuery({
        queryKey: ['partners', params],
        queryFn: () => fetchPartners(params),
        staleTime: 1000 * 60 * 2, // 2 minutos
    });
}
