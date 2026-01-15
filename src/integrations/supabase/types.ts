export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          codigo_interno: string
          created_at: string
          id: string
          local_padrao: string | null
          nome: string
          qr_code_value: string
          setor_padrao: string | null
          status: string
        }
        Insert: {
          codigo_interno: string
          created_at?: string
          id?: string
          local_padrao?: string | null
          nome: string
          qr_code_value: string
          setor_padrao?: string | null
          status?: string
        }
        Update: {
          codigo_interno?: string
          created_at?: string
          id?: string
          local_padrao?: string | null
          nome?: string
          qr_code_value?: string
          setor_padrao?: string | null
          status?: string
        }
        Relationships: []
      }
      parts_acquisition: {
        Row: {
          codigo: string | null
          created_at: string
          data_prevista_chegada: string | null
          fornecedor: string | null
          id: string
          nome_peca: string
          observacoes: string | null
          part_catalog_id: string | null
          prazo_entrega_dias: number | null
          quantidade: number
          status: Database["public"]["Enums"]["status_compra"] | null
          updated_at: string
          valor_total: number | null
          valor_unitario: number | null
          work_order_id: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          data_prevista_chegada?: string | null
          fornecedor?: string | null
          id?: string
          nome_peca: string
          observacoes?: string | null
          part_catalog_id?: string | null
          prazo_entrega_dias?: number | null
          quantidade?: number
          status?: Database["public"]["Enums"]["status_compra"] | null
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number | null
          work_order_id: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          data_prevista_chegada?: string | null
          fornecedor?: string | null
          id?: string
          nome_peca?: string
          observacoes?: string | null
          part_catalog_id?: string | null
          prazo_entrega_dias?: number | null
          quantidade?: number
          status?: Database["public"]["Enums"]["status_compra"] | null
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_acquisition_part_catalog_id_fkey"
            columns: ["part_catalog_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_acquisition_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_catalog: {
        Row: {
          categoria: string | null
          codigo_fabricante: string | null
          codigo_interno: string | null
          created_at: string
          estoque_atual: number | null
          estoque_minimo: number | null
          fornecedor_padrao: string | null
          id: string
          nome: string
          observacoes: string | null
          prazo_medio_entrega: number | null
          status: string | null
          unidade_medida: string | null
          updated_at: string
          valor_medio: number | null
        }
        Insert: {
          categoria?: string | null
          codigo_fabricante?: string | null
          codigo_interno?: string | null
          created_at?: string
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fornecedor_padrao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          prazo_medio_entrega?: number | null
          status?: string | null
          unidade_medida?: string | null
          updated_at?: string
          valor_medio?: number | null
        }
        Update: {
          categoria?: string | null
          codigo_fabricante?: string | null
          codigo_interno?: string | null
          created_at?: string
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fornecedor_padrao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          prazo_medio_entrega?: number | null
          status?: string | null
          unidade_medida?: string | null
          updated_at?: string
          valor_medio?: number | null
        }
        Relationships: []
      }
      parts_used: {
        Row: {
          codigo_peca: string | null
          created_at: string
          id: string
          item: string
          part_catalog_id: string | null
          quantidade: number
          valor_total: number | null
          valor_unitario: number | null
          work_order_id: string
        }
        Insert: {
          codigo_peca?: string | null
          created_at?: string
          id?: string
          item: string
          part_catalog_id?: string | null
          quantidade?: number
          valor_total?: number | null
          valor_unitario?: number | null
          work_order_id: string
        }
        Update: {
          codigo_peca?: string | null
          created_at?: string
          id?: string
          item?: string
          part_catalog_id?: string | null
          quantidade?: number
          valor_total?: number | null
          valor_unitario?: number | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_used_part_catalog_id_fkey"
            columns: ["part_catalog_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_used_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      preventive_actions: {
        Row: {
          created_at: string
          custo_estimado: number | null
          descricao: string
          id: string
          observacoes: string | null
          pecas_recomendadas: string | null
          periodicidade: Database["public"]["Enums"]["periodicidade"] | null
          responsavel_id: string | null
          responsavel_nome: string | null
          updated_at: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          custo_estimado?: number | null
          descricao: string
          id?: string
          observacoes?: string | null
          pecas_recomendadas?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicidade"] | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          updated_at?: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          custo_estimado?: number | null
          descricao?: string
          id?: string
          observacoes?: string | null
          pecas_recomendadas?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicidade"] | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preventive_actions_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          disponibilidade: Database["public"]["Enums"]["disponibilidade"]
          id: string
          matricula: string | null
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          disponibilidade?: Database["public"]["Enums"]["disponibilidade"]
          id?: string
          matricula?: string | null
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          disponibilidade?: Database["public"]["Enums"]["disponibilidade"]
          id?: string
          matricula?: string | null
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services_catalog: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_servico"]
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: string | null
          tempo_padrao_minutos: number | null
          tipo: Database["public"]["Enums"]["tipo_servico"]
          updated_at: string
          valor_servico: number | null
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_servico"]
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: string | null
          tempo_padrao_minutos?: number | null
          tipo?: Database["public"]["Enums"]["tipo_servico"]
          updated_at?: string
          valor_servico?: number | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_servico"]
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: string | null
          tempo_padrao_minutos?: number | null
          tipo?: Database["public"]["Enums"]["tipo_servico"]
          updated_at?: string
          valor_servico?: number | null
        }
        Relationships: []
      }
      services_executed: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome_servico: string
          service_catalog_id: string | null
          tecnico_id: string | null
          tecnico_nome: string | null
          tempo_padrao_minutos: number | null
          tempo_real_minutos: number | null
          updated_at: string
          valor_servico: number | null
          work_order_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome_servico: string
          service_catalog_id?: string | null
          tecnico_id?: string | null
          tecnico_nome?: string | null
          tempo_padrao_minutos?: number | null
          tempo_real_minutos?: number | null
          updated_at?: string
          valor_servico?: number | null
          work_order_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome_servico?: string
          service_catalog_id?: string | null
          tecnico_id?: string | null
          tecnico_nome?: string | null
          tempo_padrao_minutos?: number | null
          tempo_real_minutos?: number | null
          updated_at?: string
          valor_servico?: number | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_executed_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_executed_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          part_catalog_id: string
          quantidade: number
          quantidade_anterior: number | null
          quantidade_posterior: number | null
          tipo: string
          usuario_id: string | null
          usuario_nome: string | null
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          part_catalog_id: string
          quantidade: number
          quantidade_anterior?: number | null
          quantidade_posterior?: number | null
          tipo: string
          usuario_id?: string | null
          usuario_nome?: string | null
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          part_catalog_id?: string
          quantidade?: number
          quantidade_anterior?: number | null
          quantidade_posterior?: number | null
          tipo?: string
          usuario_id?: string | null
          usuario_nome?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_part_catalog_id_fkey"
            columns: ["part_catalog_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          acao_corretiva: string | null
          acao_preventiva: string | null
          asset_id: string
          closed_at: string | null
          created_at: string
          data_hora_fim: string | null
          data_hora_inicio: string | null
          descricao_solicitante: string
          diagnostico: string | null
          evidencia_url: string | null
          foto_solicitante_url: string | null
          id: string
          local: string | null
          prioridade: Database["public"]["Enums"]["prioridade"]
          protocolo: string
          setor: string
          solicitante_id: string | null
          solicitante_nome: string
          status: Database["public"]["Enums"]["os_status"]
          tecnico_id: string | null
          tempo_gasto: string | null
          tempo_total_horas: number | null
          tempo_total_minutos: number | null
          tipo_ocorrencia: Database["public"]["Enums"]["tipo_ocorrencia"]
        }
        Insert: {
          acao_corretiva?: string | null
          acao_preventiva?: string | null
          asset_id: string
          closed_at?: string | null
          created_at?: string
          data_hora_fim?: string | null
          data_hora_inicio?: string | null
          descricao_solicitante: string
          diagnostico?: string | null
          evidencia_url?: string | null
          foto_solicitante_url?: string | null
          id?: string
          local?: string | null
          prioridade: Database["public"]["Enums"]["prioridade"]
          protocolo: string
          setor: string
          solicitante_id?: string | null
          solicitante_nome: string
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          tempo_gasto?: string | null
          tempo_total_horas?: number | null
          tempo_total_minutos?: number | null
          tipo_ocorrencia: Database["public"]["Enums"]["tipo_ocorrencia"]
        }
        Update: {
          acao_corretiva?: string | null
          acao_preventiva?: string | null
          asset_id?: string
          closed_at?: string | null
          created_at?: string
          data_hora_fim?: string | null
          data_hora_inicio?: string | null
          descricao_solicitante?: string
          diagnostico?: string | null
          evidencia_url?: string | null
          foto_solicitante_url?: string | null
          id?: string
          local?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade"]
          protocolo?: string
          setor?: string
          solicitante_id?: string | null
          solicitante_nome?: string
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          tempo_gasto?: string | null
          tempo_total_horas?: number | null
          tempo_total_minutos?: number | null
          tipo_ocorrencia?: Database["public"]["Enums"]["tipo_ocorrencia"]
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ADMIN" | "MANUTENCAO" | "OPERACAO"
      categoria_servico:
        | "ELETRICA"
        | "MECANICA"
        | "HIDRAULICA"
        | "PNEUMATICA"
        | "AJUSTE"
        | "LUBRIFICACAO"
        | "OUTRO"
      disponibilidade: "DISPONIVEL" | "OCUPADO"
      os_status: "ABERTO" | "EM_ANDAMENTO" | "FECHADO"
      periodicidade:
        | "DIARIA"
        | "SEMANAL"
        | "MENSAL"
        | "TRIMESTRAL"
        | "SEMESTRAL"
        | "ANUAL"
      prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA"
      status_compra: "PLANEJADO" | "ORCADO" | "COMPRADO" | "RECEBIDO"
      tipo_ocorrencia:
        | "QUEBRA"
        | "FALHA_INTERMITENTE"
        | "PECA_DANIFICADA"
        | "RUIDO"
        | "VAZAMENTO"
        | "OUTRO"
      tipo_servico: "CORRETIVO" | "PREVENTIVO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN", "MANUTENCAO", "OPERACAO"],
      categoria_servico: [
        "ELETRICA",
        "MECANICA",
        "HIDRAULICA",
        "PNEUMATICA",
        "AJUSTE",
        "LUBRIFICACAO",
        "OUTRO",
      ],
      disponibilidade: ["DISPONIVEL", "OCUPADO"],
      os_status: ["ABERTO", "EM_ANDAMENTO", "FECHADO"],
      periodicidade: [
        "DIARIA",
        "SEMANAL",
        "MENSAL",
        "TRIMESTRAL",
        "SEMESTRAL",
        "ANUAL",
      ],
      prioridade: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
      status_compra: ["PLANEJADO", "ORCADO", "COMPRADO", "RECEBIDO"],
      tipo_ocorrencia: [
        "QUEBRA",
        "FALHA_INTERMITENTE",
        "PECA_DANIFICADA",
        "RUIDO",
        "VAZAMENTO",
        "OUTRO",
      ],
      tipo_servico: ["CORRETIVO", "PREVENTIVO"],
    },
  },
} as const
