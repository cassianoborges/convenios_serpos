export interface Partner {
  id: string;
  nome: string;
  categoria: string;
  porcentagem_desconto: number;
  logo_url: string;
  endereco: string;
  telefone: string;
  whatsapp?: string;
  descricao: string;
  regras?: string;
  cidade?: string;
  site?: string;
  cnpj_cpf?: string;
  unidade_id?: number;
  unidade_nome?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Mantido como alias para não quebrar imports existentes */
export type Category = string;

export interface CategoryInfo {
  id: string;
  nome: string;
  icon: string;
  color: string;
  ordem: number;
}

