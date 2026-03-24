import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import { useUnidades, useCreateUnidade, useUpdateUnidade, useDeleteUnidade } from '@/hooks/useUnidades';
import { toast } from 'sonner';

interface FormState { nome: string; cidade: string; uf: string; }

export function UnidadeManager() {
    const { data: unidades, isLoading } = useUnidades();
    const createMutation = useCreateUnidade();
    const updateMutation = useUpdateUnidade();
    const deleteMutation = useDeleteUnidade();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<FormState>({ nome: '', cidade: '', uf: '' });

    const resetForm = () => { setForm({ nome: '', cidade: '', uf: '' }); setShowForm(false); setEditingId(null); };

    const handleSave = async () => {
        if (!form.nome.trim()) { toast.error('Nome obrigatório'); return; }
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, ...form });
                toast.success('Unidade atualizada!');
            } else {
                await createMutation.mutateAsync(form);
                toast.success('Unidade criada!');
            }
            resetForm();
        } catch {
            toast.error('Erro ao salvar unidade');
        }
    };

    const handleEdit = (u: { id: number; nome: string; cidade: string; uf: string }) => {
        setEditingId(u.id);
        setForm({ nome: u.nome, cidade: u.cidade || '', uf: u.uf || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remover esta unidade?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Unidade removida');
        } catch {
            toast.error('Erro ao remover unidade');
        }
    };

    const inputClass = "flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

    return (
        <div>
            {/* Add button */}
            <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-sm mb-6 shadow-lg shadow-blue-500/20"
            >
                <Plus className="w-4 h-4" />
                Nova Unidade
            </button>

            {/* Inline form */}
            {showForm && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-slate-300 mb-3">
                        {editingId ? 'Editar Unidade' : 'Nova Unidade'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            className={inputClass}
                            placeholder="Nome da Unidade *"
                            value={form.nome}
                            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                        />
                        <input
                            className={inputClass}
                            placeholder="Cidade"
                            value={form.cidade}
                            onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                        />
                        <input
                            className="w-16 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="UF"
                            maxLength={2}
                            value={form.uf}
                            onChange={e => setForm(f => ({ ...f, uf: e.target.value.toUpperCase() }))}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-60 flex items-center gap-1.5"
                            >
                                <Check className="w-4 h-4" /> Salvar
                            </button>
                            <button onClick={resetForm} className="px-4 py-2 border border-slate-700 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors text-sm">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                    </div>
                ) : !unidades?.length ? (
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-2xl mb-2">🏢</p>
                        <p>Nenhuma unidade cadastrada</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                <th className="text-left p-4">Nome</th>
                                <th className="text-left p-4 hidden sm:table-cell">Cidade / UF</th>
                                <th className="text-center p-4">Convênios</th>
                                <th className="text-center p-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {unidades.map(u => (
                                <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 font-medium text-white">{u.nome}</td>
                                    <td className="p-4 hidden sm:table-cell text-slate-400">{u.cidade} {u.uf}</td>
                                    <td className="p-4 text-center">
                                        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-bold">
                                            {u.total_convenios}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
