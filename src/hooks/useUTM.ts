import { useEffect, useRef } from 'react';

export interface UTMParams {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    referrer?: string;
}

const SESSION_KEY = 'serpos_utm';

/**
 * Lê os parâmetros UTM da URL atual e os persiste no sessionStorage.
 * Se a URL não tiver UTMs, retorna os UTMs da sessão atual (persistidos).
 */
export function getUTMParams(): UTMParams {
    const params = new URLSearchParams(window.location.search);

    const fromUrl: UTMParams = {};
    if (params.get('utm_source')) fromUrl.utm_source = params.get('utm_source')!;
    if (params.get('utm_medium')) fromUrl.utm_medium = params.get('utm_medium')!;
    if (params.get('utm_campaign')) fromUrl.utm_campaign = params.get('utm_campaign')!;
    if (params.get('utm_term')) fromUrl.utm_term = params.get('utm_term')!;
    if (params.get('utm_content')) fromUrl.utm_content = params.get('utm_content')!;

    // Se tem UTMs na URL, salva e retorna
    if (Object.keys(fromUrl).length > 0) {
        fromUrl.referrer = document.referrer || undefined;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(fromUrl));
        return fromUrl;
    }

    // Senão, retorna os UTMs salvos da sessão
    try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
}

/** Hook que inicializa o rastreamento UTM ao montar a página */
export function useUTM() {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            getUTMParams(); // Persiste UTMs se presentes na URL
            initialized.current = true;
        }
    }, []);
}
