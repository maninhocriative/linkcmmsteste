// Maintenance Planning Types

export type FrequenciaManutencao = 'DIARIO' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
export type TipoProcedimento = 'VISUAL' | 'LIMPEZA' | 'TROCA' | 'LUBRIFICACAO' | 'AJUSTE' | 'TESTE' | 'MEDICAO';

export interface MaintenancePlanTemplate {
  id: string;
  nome: string;
  modelo_equipamento?: string;
  descricao?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePlanItem {
  id: string;
  template_id: string;
  item_number: string;
  componente: string;
  ponto_verificacao: string;
  frequencia: FrequenciaManutencao;
  tipo_procedimento: TipoProcedimento;
  instrucoes?: string;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface AssetMaintenanceOverride {
  id: string;
  asset_id: string;
  template_id?: string;
  item_id?: string;
  frequencia_customizada?: FrequenciaManutencao;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetExtended {
  id: string;
  qr_code_value: string;
  nome: string;
  codigo_interno: string;
  setor_padrao?: string;
  local_padrao?: string;
  status: string;
  tag?: string;
  modelo?: string;
  numero_serie?: string;
  fabricante?: string;
  maintenance_template_id?: string;
  maintenance_template?: MaintenancePlanTemplate;
}

// Labels for UI display
export const FREQUENCIA_LABELS: Record<FrequenciaManutencao, string> = {
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export const TIPO_PROCEDIMENTO_LABELS: Record<TipoProcedimento, string> = {
  VISUAL: 'Inspeção Visual',
  LIMPEZA: 'Limpeza',
  TROCA: 'Troca',
  LUBRIFICACAO: 'Lubrificação',
  AJUSTE: 'Ajuste',
  TESTE: 'Teste',
  MEDICAO: 'Medição',
};

// Month columns for annual plan
export const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

// Calculate which months an item should be executed based on frequency
export function getMonthsForFrequency(frequencia: FrequenciaManutencao): number[] {
  switch (frequencia) {
    case 'DIARIO':
    case 'SEMANAL':
    case 'QUINZENAL':
    case 'MENSAL':
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // All months
    case 'TRIMESTRAL':
      return [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    case 'SEMESTRAL':
      return [0, 6]; // Jan, Jul
    case 'ANUAL':
      return [0]; // Jan only
    default:
      return [];
  }
}
