import { useState } from 'react';
import { Pencil, Trash2, Plus, Search, AlertTriangle, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Partner } from '@/types/partner';
import { useCategorias, getCategoryInfo } from '@/hooks/useCategorias';
import { ConvenioForm } from './ConvenioForm';
import { toast } from 'sonner';

async function fetchAllConvenios(): Promise<{ data: Partner[] }> {
    const { data } = await api.get('/convenios?limit=200&includeInactive=true');
    return data;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export function ConvenioTable() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Partner | undefined>(undefined);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const { data: categories = [] } = useCategorias();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-convenios'],
        queryFn: fetchAllConvenios,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/convenios/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-convenios'] });
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            toast.success('Convênio removido');
            setConfirmDelete(null);
        },
        onError: () => toast.error('Erro ao remover convênio'),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
            api.put(`/convenios/${id}`, { ativo }).then(r => r.data),
        onSuccess: (_, { ativo }) => {
            queryClient.invalidateQueries({ queryKey: ['admin-convenios'] });
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            toast.success(ativo ? 'Convênio ativado!' : 'Convênio desativado!');
        },
        onError: () => toast.error('Erro ao alterar status'),
    });

    const convenios = data?.data ?? [];

    const filtered = convenios.filter(c => {
        const matchSearch =
            c.nome.toLowerCase().includes(search.toLowerCase()) ||
            c.categoria.toLowerCase().includes(search.toLowerCase()) ||
            (c.unidade_nome ?? '').toLowerCase().includes(search.toLowerCase());

        const matchStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && c.ativo !== false) ||
            (statusFilter === 'inactive' && c.ativo === false);

        return matchSearch && matchStatus;
    });

    const handleEdit = (c: Partner) => {
        setEditing(c);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setEditing(undefined);
        setShowForm(false);
        queryClient.invalidateQueries({ queryKey: ['admin-convenios'] });
    };

    const activeCount   = convenios.filter(c => c.ativo !== false).length;
    const inactiveCount = convenios.filter(c => c.ativo === false).length;

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome, categoria ou unidade..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <button
                    onClick={() => { setEditing(undefined); setShowForm(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-sm shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Novo Convênio
                </button>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-2 mb-4">
                {([
                    { key: 'all',      label: `Todos (${convenios.length})` },
                    { key: 'active',   label: `✅ Ativos (${activeCount})` },
                    { key: 'inactive', label: `🚫 Inativos (${inactiveCount})` },
                ] as { key: StatusFilter; label: string }[]).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            statusFilter === tab.key
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <p className="text-3xl mb-3">📋</p>
                        <p>{search ? 'Nenhum resultado encontrado' : 'Nenhum convênio cadastrado ainda'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                    <th className="text-left p-4">Parceiro</th>
                                    <th className="text-left p-4 hidden md:table-cell">Categoria</th>
                                    <th className="text-center p-4">Desconto</th>
                                    <th className="text-left p-4 hidden lg:table-cell">Unidade</th>
                                    <th className="text-center p-4">Status</th>
                                    <th className="text-center p-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filtered.map((c) => {
                                    const cat = getCategoryInfo(c.categoria, categories);
                                    const isActive = c.ativo !== false;
                                    const isToggling = toggleMutation.isPending && toggleMutation.variables?.id === c.id;
                                    return (
                                        <tr
                                            key={c.id}
                                            className={`hover:bg-slate-700/30 transition-colors group ${!isActive ? 'opacity-50' : ''}`}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {c.logo_url ? (
                                                        <img src={c.logo_url} alt={c.nome} className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg">
                                                            {cat.icon}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-white">{c.nome}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.endereco}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cat.color}`}>
                                                    {cat.icon} {cat.nome}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    -{c.porcentagem_desconto}%
                                                </span>
                                            </td>
                                            <td className="p-4 hidden lg:table-cell text-slate-300 text-xs">
                                                {c.unidade_nome ?? '—'}
                                            </td>

                                            {/* Toggle Status */}
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleMutation.mutate({ id: c.id, ativo: !isActive })}
                                                    disabled={isToggling}
                                                    title={isActive ? 'Desativar convênio' : 'Ativar convênio'}
                                                    className="flex items-center gap-1.5 mx-auto group/toggle"
                                                >
                                                    {isToggling ? (
                                                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                                    ) : isActive ? (
                                                        <ToggleRight className="w-8 h-8 text-green-400 group-hover/toggle:text-green-300 transition-colors" />
                                                    ) : (
                                                        <ToggleLeft className="w-8 h-8 text-slate-500 group-hover/toggle:text-slate-300 transition-colors" />
                                                    )}
                                                    <span className={`text-xs font-medium ${isActive ? 'text-green-400' : 'text-slate-500'}`}>
                                                        {isActive ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </button>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(c)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(c.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                        title="Remover"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p className="text-xs text-slate-600 mt-3">{filtered.length} de {convenios.length} convênios</p>

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <h3 className="text-lg font-bold text-white">Confirmar Remoção</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">
                            Tem certeza que deseja remover este convênio? Esta ação pode ser revertida pelo administrador do banco de dados.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(confirmDelete)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {deleteMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Removendo...</> : 'Remover'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && <ConvenioForm convenio={editing} onClose={handleCloseForm} />}
        </div>
    );
}
