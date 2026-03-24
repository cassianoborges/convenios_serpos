import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Users, MousePointerClick, Search, TrendingUp, Calendar } from 'lucide-react';
import api from '@/services/api';

interface Resumo {
    totais: { event_name: string; total: string }[];
    topParceiros: { partner_nome: string; cliques: string }[];
    topUtmSource: { fonte: string; total: string }[];
    porDia: { dia: string; total: string }[];
    topCategorias: { categoria: string; total: string }[];
}

const DAYS_OPTIONS = [7, 15, 30, 90];

const EVENT_LABELS: Record<string, string> = {
    page_view: '👁️ Visualizações',
    partner_click: '🤝 Cliques em Parceiros',
    contact_click: '📞 Cliques em Contato',
    category_filter: '🏷️ Filtros de Categoria',
    unidade_filter: '🏢 Filtros de Unidade',
    search: '🔍 Buscas',
};

export function Analytics() {
    const [days, setDays] = useState(30);

    const { data, isLoading } = useQuery<Resumo>({
        queryKey: ['analytics-resumo', days],
        queryFn: () => api.get(`/eventos/resumo?days=${days}`).then(r => r.data),
        refetchInterval: 60_000, // atualiza a cada 1 min
    });

    const totalEventos = data?.totais.reduce((sum, t) => sum + parseInt(t.total), 0) ?? 0;
    const totalCliques = parseInt(data?.totais.find(t => t.event_name === 'partner_click')?.total ?? '0');
    const totalBuscas = parseInt(data?.totais.find(t => t.event_name === 'search')?.total ?? '0');
    const totalVisualizacoes = parseInt(data?.totais.find(t => t.event_name === 'page_view')?.total ?? '0');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <BarChart2 className="w-10 h-10 text-blue-400 animate-pulse mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Carregando analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Período */}
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Período:</span>
                {DAYS_OPTIONS.map(d => (
                    <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${days === d
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-400 hover:bg-slate-800 border border-transparent'
                            }`}
                    >
                        {d}d
                    </button>
                ))}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total de Eventos', value: totalEventos, icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
                    { label: 'Visualizações', value: totalVisualizacoes, icon: <Users className="w-5 h-5" />, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
                    { label: 'Cliques em Parceiros', value: totalCliques, icon: <MousePointerClick className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
                    { label: 'Buscas', value: totalBuscas, icon: <Search className="w-5 h-5" />, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
                ].map(card => (
                    <div key={card.label} className={`p-4 rounded-2xl border bg-slate-800/50 ${card.color.split(' ')[2]}`}>
                        <div className={`inline-flex p-2 rounded-xl mb-3 border ${card.color}`}>
                            {card.icon}
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-slate-500 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top parceiros clicados */}
                <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700 p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <MousePointerClick className="w-4 h-4 text-emerald-400" /> Top Parceiros Clicados
                    </h3>
                    {!data?.topParceiros.length ? (
                        <p className="text-slate-600 text-sm text-center py-8">Nenhum clique registrado ainda</p>
                    ) : (
                        <div className="space-y-3">
                            {data.topParceiros.map((p, i) => {
                                const max = parseInt(data.topParceiros[0].cliques);
                                const pct = Math.round((parseInt(p.cliques) / max) * 100);
                                return (
                                    <div key={p.partner_nome}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-slate-300 flex items-center gap-2">
                                                <span className="text-slate-600 text-xs w-4">{i + 1}.</span>
                                                {p.partner_nome}
                                            </span>
                                            <span className="text-xs font-bold text-white">{p.cliques}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top UTM Sources */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" /> Origem do Tráfego
                    </h3>
                    {!data?.topUtmSource.length ? (
                        <p className="text-slate-600 text-sm text-center py-8">Sem dados</p>
                    ) : (
                        <div className="space-y-2">
                            {data.topUtmSource.map(s => (
                                <div key={s.fonte} className="flex items-center justify-between p-2.5 bg-slate-700/40 rounded-xl">
                                    <span className="text-sm text-slate-300 capitalize">{s.fonte}</span>
                                    <span className="text-xs font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-0.5 rounded-full">
                                        {s.total}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Linha inferior: eventos por tipo + top categorias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Eventos por tipo */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Eventos por Tipo</h3>
                    <div className="space-y-2">
                        {data?.totais.map(t => (
                            <div key={t.event_name} className="flex items-center justify-between p-2.5 bg-slate-700/40 rounded-xl">
                                <span className="text-sm text-slate-300">{EVENT_LABELS[t.event_name] ?? t.event_name}</span>
                                <span className="text-xs font-bold text-white">{parseInt(t.total).toLocaleString('pt-BR')}</span>
                            </div>
                        ))}
                        {!data?.totais.length && <p className="text-slate-600 text-sm text-center py-6">Nenhum evento registrado</p>}
                    </div>
                </div>

                {/* Top categorias filtradas */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Categorias Mais Filtradas</h3>
                    <div className="space-y-2">
                        {data?.topCategorias.map(c => (
                            <div key={c.categoria} className="flex items-center justify-between p-2.5 bg-slate-700/40 rounded-xl">
                                <span className="text-sm text-slate-300 capitalize">{c.categoria}</span>
                                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">{c.total}</span>
                            </div>
                        ))}
                        {!data?.topCategorias.length && <p className="text-slate-600 text-sm text-center py-6">Sem dados de filtro</p>}
                    </div>
                </div>
            </div>

            {/*  Últimos dias */}
            {!!data?.porDia.length && (
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Atividade por Dia</h3>
                    <div className="flex items-end gap-1.5 h-20">
                        {data.porDia.map(d => {
                            const max = Math.max(...data.porDia.map(x => parseInt(x.total)));
                            const h = Math.round((parseInt(d.total) / max) * 100);
                            return (
                                <div key={d.dia} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.dia}: ${d.total}`}>
                                    <span className="text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{d.total}</span>
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-sm transition-all duration-500"
                                        style={{ height: `${Math.max(h, 4)}%` }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-600">
                        <span>{data.porDia[0]?.dia}</span>
                        <span>{data.porDia[data.porDia.length - 1]?.dia}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
