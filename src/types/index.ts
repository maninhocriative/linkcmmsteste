export type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'FECHADO';
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TipoOcorrencia = 'QUEBRA' | 'FALHA_INTERMITENTE' | 'PECA_DANIFICADA' | 'RUIDO' | 'VAZAMENTO' | 'OUTRO';
export type UserRole = 'MANUTENCAO' | 'OPERACAO' | 'ADMIN';
export type Disponibilidade = 'DISPONIVEL' | 'OCUPADO';

export interface Asset {
  id: string;
  qr_code_value: string;
  nome: string;
  codigo_interno: string;
  setor_padrao: string;
  local_padrao: string;
  status: 'ativo' | 'inativo';
}

export interface PartUsed {
  id: string;
  work_order_id: string;
  item: string;
  quantidade: number;
  codigo_peca?: string;
}

export interface User {
  id: string;
  nome: string;
  role: UserRole;
  disponibilidade: Disponibilidade;
}

export interface WorkOrder {
  id: string;
  protocolo: string;
  asset_id: string;
  asset?: Asset;
  setor: string;
  local: string;
  tipo_ocorrencia: TipoOcorrencia;
  prioridade: Prioridade;
  descricao_solicitante: string;
  foto_solicitante_url?: string;
  solicitante_nome: string;
  created_at: string;
  status: Status;
  tecnico_id?: string;
  tecnico?: User;
  diagnostico?: string;
  acao_corretiva?: string;
  acao_preventiva?: string;
  tempo_gasto?: string;
  evidencia_url?: string;
  closed_at?: string;
  parts_used?: PartUsed[];
}
