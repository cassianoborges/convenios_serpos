import { useCallback } from 'react';
import api from '@/services/api';
import { getUTMParams } from './useUTM';

export type EventName =
    | 'page_view'
    | 'partner_click'
    | 'contact_click'
    | 'category_filter'
    | 'unidade_filter'
    | 'search';

export interface TrackPayload {
    partner_id?: number;
    partner_nome?: string;
    categoria?: string;
    unidade_id?: number;
    valor?: string;
}

/**
 * Hook para rastrear eventos no SERPOS.
 * Captura UTMs automaticamente do sessionStorage.
 * 
 * Uso:
 *   const { track } = useTracking();
 *   track('partner_click', { partner_id: 1, partner_nome: 'Clínica X', categoria: 'saude' });
 */
export function useTracking() {
    const track = useCallback((event_name: EventName, payload: TrackPayload = {}) => {
        const utms = getUTMParams();

        // Fire-and-forget — erros de analytics não bloqueiam o usuário
        api.post('/eventos', {
            event_name,
            ...payload,
            ...utms,
        }).catch(() => {/* silencioso */ });
    }, []);

    return { track };
}
