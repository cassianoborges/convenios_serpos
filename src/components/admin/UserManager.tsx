import { useState } from 'react';
import { Users, Plus, Trash2, AlertTriangle, Loader2, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface AdminUser {
    id: number;
    nome: string;
    email: string;
    created_at: string;
}

interface NewUserForm {
    nome: string;
    email: string;
    senha: string;
}

async function fetchUsers(): Promise<AdminUser[]> {
    const { data } = await api.get('/auth/users');
    return data;
}

export function UserManager() {
    const queryClient = useQueryClient();
    const { admin: currentAdmin } = useAuth();

    const [showForm, setShowForm] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState<NewUserForm>({ nome: '', email: '', senha: '' });
    const [formError, setFormError] = useState('');

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: fetchUsers,
    });

    const createMutation = useMutation({
        mutationFn: (payload: NewUserForm) => api.post('/auth/users', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Usuário criado com sucesso');
            setShowForm(false);
            setForm({ nome: '', email: '', senha: '' });
            setFormError('');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.error ?? 'Erro ao criar usuário';
            setFormError(msg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/auth/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Usuário removido');
            setConfirmDelete(null);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.error ?? 'Erro ao remover usuário';
            toast.error(msg);
            setConfirmDelete(null);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.nome.trim() || !form.email.trim() || !form.senha) {
            setFormError('Preencha todos os campos');
            return;
        }
        createMutation.mutate(form);
    };

    const formatDate = (iso: string) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold text-base">Administradores</h2>
                    <p className="text-slate-500 text-xs mt-0.5">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setFormError(''); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-sm shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Novo Usuário
                </button>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum usuário cadastrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                    <th className="text-left p-4">Usuário</th>
                                    <th className="text-left p-4 hidden md:table-cell">E-mail</th>
                                    <th className="text-left p-4 hidden lg:table-cell">Cadastrado em</th>
                                    <th className="text-center p-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {users.map((user) => {
                                    const isMe = user.id === currentAdmin?.id;
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                        {user.nome?.[0]?.toUpperCase() ?? 'A'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white flex items-center gap-1.5">
                                                            {user.nome}
                                                            {isMe && (
                                                                <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-normal">
                                                                    Você
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5 md:hidden">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden md:table-cell text-slate-300 text-sm">{user.email}</td>
                                            <td className="p-4 hidden lg:table-cell text-slate-400 text-xs">{formatDate(user.created_at)}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center">
                                                    {isMe ? (
                                                        <span className="flex items-center gap-1 text-xs text-slate-600">
                                                            <ShieldCheck className="w-4 h-4" />
                                                            Conta atual
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDelete(user.id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                            title="Remover usuário"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
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

            {/* Confirm Delete Modal */}
            {confirmDelete !== null && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <h3 className="text-lg font-bold text-white">Remover Usuário</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">
                            Tem certeza que deseja remover este administrador? Esta ação não pode ser desfeita.
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

            {/* New User Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-base">Novo Administrador</h3>
                                    <p className="text-slate-500 text-xs">Crie um novo acesso ao painel</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowForm(false); setFormError(''); }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nome */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome completo</label>
                                <input
                                    type="text"
                                    value={form.nome}
                                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                                    placeholder="Ex: João Silva"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            {/* E-mail */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="joao@serpos.com.br"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            {/* Senha */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Senha <span className="text-slate-600">(mín. 6 caracteres)</span></label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.senha}
                                        onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 pr-11 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
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
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setFormError(''); }}
                                    className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold transition-all hover:opacity-90 text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
