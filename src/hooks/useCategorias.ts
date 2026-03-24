import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface CategoryInfo {
    id: string;
    nome: string;
    icon: string;
    color: string;
    ordem: number;
}

async function fetchCategorias(): Promise<CategoryInfo[]> {
    const { data } = await api.get('/categorias');
    return data;
}

export function useCategorias() {
    return useQuery<CategoryInfo[]>({
        queryKey: ['categorias'],
        queryFn: fetchCategorias,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });
}

/** Retorna info da categoria pelo id, com fallback genérico */
export function getCategoryInfo(id: string, categories: CategoryInfo[]): CategoryInfo {
    return (
        categories.find((c) => c.id === id) ?? {
            id,
            nome: id,
            icon: '🏷️',
            color: 'bg-gray-100 text-gray-700 border-gray-200',
            ordem: 999,
        }
    );
}
