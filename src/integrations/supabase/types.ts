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
      parts_used: {
        Row: {
          codigo_peca: string | null
          created_at: string
          id: string
          item: string
          quantidade: number
          work_order_id: string
        }
        Insert: {
          codigo_peca?: string | null
          created_at?: string
          id?: string
          item: string
          quantidade?: number
          work_order_id: string
        }
        Update: {
          codigo_peca?: string | null
          created_at?: string
          id?: string
          item?: string
          quantidade?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_used_work_order_id_fkey"
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
          tipo_ocorrencia: Database["public"]["Enums"]["tipo_ocorrencia"]
        }
        Insert: {
          acao_corretiva?: string | null
          acao_preventiva?: string | null
          asset_id: string
          closed_at?: string | null
          created_at?: string
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
          tipo_ocorrencia: Database["public"]["Enums"]["tipo_ocorrencia"]
        }
        Update: {
          acao_corretiva?: string | null
          acao_preventiva?: string | null
          asset_id?: string
          closed_at?: string | null
          created_at?: string
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
      disponibilidade: "DISPONIVEL" | "OCUPADO"
      os_status: "ABERTO" | "EM_ANDAMENTO" | "FECHADO"
      prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA"
      tipo_ocorrencia:
        | "QUEBRA"
        | "FALHA_INTERMITENTE"
        | "PECA_DANIFICADA"
        | "RUIDO"
        | "VAZAMENTO"
        | "OUTRO"
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
      disponibilidade: ["DISPONIVEL", "OCUPADO"],
      os_status: ["ABERTO", "EM_ANDAMENTO", "FECHADO"],
      prioridade: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
      tipo_ocorrencia: [
        "QUEBRA",
        "FALHA_INTERMITENTE",
        "PECA_DANIFICADA",
        "RUIDO",
        "VAZAMENTO",
        "OUTRO",
      ],
    },
  },
} as const
