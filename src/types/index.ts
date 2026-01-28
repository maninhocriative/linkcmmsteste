export type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'FECHADO';
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TipoOcorrencia = 'QUEBRA' | 'FALHA_INTERMITENTE' | 'PECA_DANIFICADA' | 'RUIDO' | 'VAZAMENTO' | 'OUTRO';
export type UserRole = 'MANUTENCAO' | 'OPERACAO' | 'ADMIN';
export type Disponibilidade = 'DISPONIVEL' | 'OCUPADO';
export type StatusCompra = 'PLANEJADO' | 'ORCADO' | 'COMPRADO' | 'RECEBIDO';
export type TipoServico = 'CORRETIVO' | 'PREVENTIVO';
export type CategoriaServico = 'ELETRICA' | 'MECANICA' | 'HIDRAULICA' | 'PNEUMATICA' | 'AJUSTE' | 'LUBRIFICACAO' | 'OUTRO';
export type Periodicidade = 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export interface Asset {
  id: string;
  qr_code_value: string;
  nome: string;
  codigo_interno: string;
  setor_padrao?: string | null;
  local_padrao?: string | null;
  status: string;
  tag?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  fabricante?: string | null;
  maintenance_template_id?: string | null;
  created_at?: string;
}

export interface PartUsed {
  id: string;
  work_order_id: string;
  item: string;
  quantidade: number;
  codigo_peca?: string;
  part_catalog_id?: string;
  valor_unitario?: number;
  valor_total?: number;
}

export interface User {
  id: string;
  nome: string;
  role: UserRole;
  disponibilidade: Disponibilidade;
}

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  matricula?: string;
  disponibilidade: Disponibilidade;
  created_at: string;
  updated_at: string;
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
  // New automatic time fields
  data_hora_inicio?: string;
  data_hora_fim?: string;
  tempo_total_minutos?: number;
  tempo_total_horas?: number;
}

// Parts Catalog
export interface PartCatalog {
  id: string;
  nome: string;
  codigo_interno?: string;
  codigo_fabricante?: string;
  categoria?: string;
  fornecedor_padrao?: string;
  valor_medio: number;
  prazo_medio_entrega: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  observacoes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Services Catalog
export interface ServiceCatalog {
  id: string;
  nome: string;
  descricao?: string;
  tipo: TipoServico;
  categoria: CategoriaServico;
  tempo_padrao_minutos: number;
  valor_servico: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Parts Acquisition Plan
export interface PartAcquisition {
  id: string;
  work_order_id: string;
  part_catalog_id?: string;
  nome_peca: string;
  codigo?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  fornecedor?: string;
  prazo_entrega_dias?: number;
  data_prevista_chegada?: string;
  status: StatusCompra;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Preventive Action (structured)
export interface PreventiveAction {
  id: string;
  work_order_id: string;
  descricao: string;
  pecas_recomendadas?: string;
  custo_estimado: number;
  periodicidade?: Periodicidade;
  responsavel_id?: string;
  responsavel_nome?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Services Executed
export interface ServiceExecuted {
  id: string;
  work_order_id: string;
  service_catalog_id?: string;
  nome_servico: string;
  descricao?: string;
  tempo_padrao_minutos: number;
  tempo_real_minutos: number;
  valor_servico: number;
  tecnico_id?: string;
  tecnico_nome?: string;
  created_at: string;
  updated_at: string;
}

// Stock Movement
export interface StockMovement {
  id: string;
  part_catalog_id: string;
  work_order_id?: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  quantidade_anterior?: number;
  quantidade_posterior?: number;
  motivo?: string;
  usuario_id?: string;
  usuario_nome?: string;
  created_at: string;
}
