import { useState } from 'react';
import { Tag, Plus, Pencil, Trash2, AlertTriangle, Loader2, X, GripVertical } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCategorias, CategoryInfo } from '@/hooks/useCategorias';
import api from '@/services/api';
import { toast } from 'sonner';

// Paleta de cores pré-definida para facilitar a seleção
const COLOR_PALETTE: { label: string; value: string }[] = [
    { label: 'Vermelho', value: 'bg-red-100 text-red-700 border-red-200' },
    { label: 'Azul', value: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Roxo', value: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'Laranja', value: 'bg-orange-100 text-orange-700 border-orange-200' },
    { label: 'Cinza', value: 'bg-gray-100 text-gray-700 border-gray-200' },
    { label: 'Rosa', value: 'bg-pink-100 text-pink-700 border-pink-200' },
    { label: 'Ciano', value: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { label: 'Verde', value: 'bg-green-100 text-green-700 border-green-200' },
    { label: 'Amarelo', value: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { label: 'Índigo', value: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { label: 'Esmeralda', value: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { label: 'Âmbar', value: 'bg-amber-100 text-amber-700 border-amber-200' },
];

interface FormState {
    id: string;
    nome: string;
    icon: string;
    color: string;
    ordem: number;
}

const defaultForm: FormState = {
    id: '',
    nome: '',
    icon: '🏷️',
    color: COLOR_PALETTE[0].value,
    ordem: 0,
};

export function CategoriaManager() {
    const queryClient = useQueryClient();
    const { data: categories = [], isLoading } = useCategorias();

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<CategoryInfo | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(defaultForm);
    const [formError, setFormError] = useState('');

    // ── Mutations ──────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data: FormState) => api.post('/categorias', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
            toast.success('Categoria criada!');
            closeForm();
        },
        onError: (err: any) => setFormError(err?.response?.data?.error ?? 'Erro ao criar'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) =>
            api.put(`/categorias/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
            toast.success('Categoria atualizada!');
            closeForm();
        },
        onError: (err: any) => setFormError(err?.response?.data?.error ?? 'Erro ao atualizar'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/categorias/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
            toast.success('Categoria removida!');
            setConfirmDelete(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error ?? 'Erro ao remover');
            setConfirmDelete(null);
        },
    });

    // ── Helpers ────────────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditing(null);
        setForm({ ...defaultForm, ordem: categories.length + 1 });
        setFormError('');
        setShowForm(true);
    };

    const openEdit = (cat: CategoryInfo) => {
        setEditing(cat);
        setForm({ id: cat.id, nome: cat.nome, icon: cat.icon, color: cat.color, ordem: cat.ordem });
        setFormError('');
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        setForm(defaultForm);
        setFormError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.nome.trim() || !form.icon.trim()) {
            setFormError('Nome e ícone são obrigatórios');
            return;
        }
        if (!editing && !form.id.trim()) {
            setFormError('O ID (slug) é obrigatório');
            return;
        }
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: { nome: form.nome, icon: form.icon, color: form.color, ordem: form.ordem } });
        } else {
            createMutation.mutate(form);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
    const labelClass = "block text-xs font-medium text-slate-400 mb-1.5";

    return (
        <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold text-base">Categorias</h2>
                    <p className="text-slate-500 text-xs mt-0.5">{categories.length} categoria{categories.length !== 1 ? 's' : ''} ativa{categories.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-sm shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Nova Categoria
                </button>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma categoria cadastrada</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                    <th className="text-left p-4 w-8"></th>
                                    <th className="text-left p-4">Categoria</th>
                                    <th className="text-left p-4 hidden md:table-cell">ID / Slug</th>
                                    <th className="text-left p-4 hidden lg:table-cell">Preview</th>
                                    <th className="text-center p-4 hidden sm:table-cell">Ordem</th>
                                    <th className="text-center p-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-slate-600">
                                            <GripVertical className="w-4 h-4" />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-xl">
                                                    {cat.icon}
                                                </div>
                                                <p className="font-medium text-white">{cat.nome}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <code className="text-xs bg-slate-700/50 text-cyan-400 px-2 py-1 rounded-md">{cat.id}</code>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cat.color}`}>
                                                {cat.icon} {cat.nome}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center hidden sm:table-cell">
                                            <span className="text-slate-400 text-xs">{cat.ordem}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEdit(cat)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(cat.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                    title="Remover"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <h3 className="text-lg font-bold text-white">Remover Categoria</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-1">Tem certeza? A remoção será bloqueada se houver convênios ativos nesta categoria.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-sm">Cancelar</button>
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

            {/* Create / Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                                    <Tag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-base">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                                    <p className="text-slate-500 text-xs">{editing ? `Editando: ${editing.id}` : 'Preencha os dados abaixo'}</p>
                                </div>
                            </div>
                            <button onClick={closeForm} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Preview do badge */}
                            <div className="flex items-center justify-center py-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${form.color}`}>
                                    <span className="text-base">{form.icon || '🏷️'}</span>
                                    <span>{form.nome || 'Preview'}</span>
                                </span>
                            </div>

                            {/* ID / Slug — apenas para criação */}
                            {!editing && (
                                <div>
                                    <label className={labelClass}>ID / Slug <span className="text-slate-600">(apenas letras minúsculas e _)</span></label>
                                    <input
                                        type="text"
                                        value={form.id}
                                        onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') }))}
                                        placeholder="ex: tecnologia"
                                        className={inputClass}
                                    />
                                </div>
                            )}

                            {/* Nome */}
                            <div>
                                <label className={labelClass}>Nome</label>
                                <input
                                    type="text"
                                    value={form.nome}
                                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                                    placeholder="Ex: Tecnologia"
                                    className={inputClass}
                                />
                            </div>

                            {/* Ícone */}
                            <div>
                                <label className={labelClass}>Ícone <span className="text-slate-600">(emoji)</span></label>
                                <input
                                    type="text"
                                    value={form.icon}
                                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                                    placeholder="💻"
                                    className={inputClass}
                                    maxLength={4}
                                />
                            </div>

                            {/* Cor */}
                            <div>
                                <label className={labelClass}>Cor do badge</label>
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    {COLOR_PALETTE.map(c => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, color: c.value }))}
                                            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${c.value} ${form.color === c.value ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ordem */}
                            <div>
                                <label className={labelClass}>Ordem de exibição</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.ordem}
                                    onChange={e => setForm(f => ({ ...f, ordem: Number(e.target.value) }))}
                                    className={inputClass}
                                />
                            </div>

                            {/* Error */}
                            {formError && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    {formError}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-sm">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold hover:opacity-90 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : (editing ? 'Salvar Alterações' : 'Criar Categoria')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
