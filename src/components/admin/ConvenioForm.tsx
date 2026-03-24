import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Upload, Loader2, ImageIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Partner } from '@/types/partner';
import { useUnidades } from '@/hooks/useUnidades';
import { useCategorias } from '@/hooks/useCategorias';
import { toast } from 'sonner';

const schema = z.object({
    nome: z.string().min(2, 'Nome obrigatório'),
    categoria: z.string().min(1, 'Categoria obrigatória'),
    porcentagem_desconto: z.coerce.number().min(1).max(100),
    logo_url: z.string().optional(),
    endereco: z.string().optional(),
    telefone: z.string().optional(),
    whatsapp: z.string().optional(),
    descricao: z.string().optional(),
    regras: z.string().optional(),
    cidade: z.string().optional(),
    site: z.string().optional(),
    cnpj_cpf: z.string().optional(),
    unidade_id: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    convenio?: Partner;
    onClose: () => void;
}

export function ConvenioForm({ convenio, onClose }: Props) {
    const queryClient = useQueryClient();
    const { data: unidades } = useUnidades();
    const { data: categories = [] } = useCategorias();
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>(convenio?.logo_url || '');
    const fileRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: convenio?.nome ?? '',
            categoria: convenio?.categoria ?? '',
            porcentagem_desconto: convenio?.porcentagem_desconto ?? 10,
            logo_url: convenio?.logo_url ?? '',
            endereco: convenio?.endereco ?? '',
            telefone: convenio?.telefone ?? '',
            whatsapp: convenio?.whatsapp ?? '',
            descricao: convenio?.descricao ?? '',
            regras: convenio?.regras ?? '',
            cidade: convenio?.cidade ?? '',
            site: convenio?.site ?? '',
            cnpj_cpf: convenio?.cnpj_cpf ?? '',
            unidade_id: convenio?.unidade_id,
        },
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => {
            if (convenio) {
                return api.put(`/convenios/${convenio.id}`, data).then(r => r.data);
            }
            return api.post('/convenios', data).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            toast.success(convenio ? 'Convênio atualizado!' : 'Convênio criado!');
            onClose();
        },
        onError: () => {
            toast.error('Erro ao salvar convênio');
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const { data } = await api.post('/upload/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setValue('logo_url', data.url);
            setPreviewUrl(data.url);
            toast.success('Logo enviado!');
        } catch {
            toast.error('Erro ao enviar logo');
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = (data: FormData) => mutation.mutate(data);

    const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
    const labelClass = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">
                        {convenio ? 'Editar Convênio' : 'Novo Convênio'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    {/* Logo Upload */}
                    <div>
                        <label className={labelClass}>Logo do Parceiro</label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-colors flex items-center gap-4"
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="preview" className="w-20 h-20 object-cover rounded-lg" />
                            ) : (
                                <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-slate-600" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-white font-medium">
                                    {uploading ? 'Enviando...' : 'Clique para selecionar'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP · Máx 5MB</p>
                            </div>
                            {uploading && <Loader2 className="w-5 h-5 text-blue-400 animate-spin ml-auto" />}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </div>

                    {/* Row: Nome + Desconto */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Nome do Parceiro *</label>
                            <input {...register('nome')} className={inputClass} placeholder="Ex: Clínica Saúde Total" />
                            {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Desconto (%) *</label>
                            <input {...register('porcentagem_desconto')} type="number" min={1} max={100} className={inputClass} placeholder="20" />
                            {errors.porcentagem_desconto && <p className="text-red-400 text-xs mt-1">1-100</p>}
                        </div>
                    </div>

                    {/* Row: Categoria + Unidade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Categoria *</label>
                            <select {...register('categoria')} className={inputClass}>
                                <option value="" className="bg-slate-800">Selecione...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id} className="bg-slate-800">
                                        {c.icon} {c.nome}
                                    </option>
                                ))}
                            </select>
                            {errors.categoria && <p className="text-red-400 text-xs mt-1">{errors.categoria.message}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Unidade</label>
                            <select {...register('unidade_id')} className={inputClass}>
                                <option value="" className="bg-slate-800">Todas / Não definida</option>
                                {unidades?.map(u => (
                                    <option key={u.id} value={u.id} className="bg-slate-800">{u.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Telefone + WhatsApp */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Telefone</label>
                            <input {...register('telefone')} className={inputClass} placeholder="(62) 3333-3333" />
                        </div>
                        <div>
                            <label className={labelClass}>WhatsApp</label>
                            <input {...register('whatsapp')} className={inputClass} placeholder="(62) 9 9999-9999" />
                        </div>
                    </div>

                    {/* Site + CNPJ/CPF */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Site</label>
                            <input {...register('site')} className={inputClass} placeholder="https://www.exemplo.com.br" />
                        </div>
                        <div>
                            <label className={labelClass}>CNPJ / CPF</label>
                            <input {...register('cnpj_cpf')} className={inputClass} placeholder="00.000.000/0001-00" />
                        </div>
                    </div>

                    {/* Cidade + Endereço */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Cidade</label>
                            <input {...register('cidade')} className={inputClass} placeholder="Goiânia" />
                        </div>
                        <div>
                            <label className={labelClass}>Endereço</label>
                            <input {...register('endereco')} className={inputClass} placeholder="Av. T-63, 1456 - Setor Bueno" />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className={labelClass}>Descrição</label>
                        <textarea {...register('descricao')} rows={3} className={inputClass} placeholder="Breve descrição do parceiro..." />
                    </div>

                    {/* Regras */}
                    <div>
                        <label className={labelClass}>Como obter o desconto / Regras</label>
                        <textarea {...register('regras')} rows={3} className={inputClass} placeholder="Apresentar carteirinha do Grupo Serpos válida..." />
                    </div>

                    {/* Ações */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || mutation.isPending}
                            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {(isSubmitting || mutation.isPending) ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                            ) : (
                                convenio ? 'Salvar Alterações' : 'Criar Convênio'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
