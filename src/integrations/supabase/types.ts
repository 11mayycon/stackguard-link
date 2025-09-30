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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      historico_vendas: {
        Row: {
          codigo_produto: string
          created_at: string | null
          id: string
          image_urls: string[] | null
          observacao: string | null
          produto_id: string | null
          quantidade_ajustada: number
          tipo: string
          usuario_id: string
        }
        Insert: {
          codigo_produto: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          observacao?: string | null
          produto_id?: string | null
          quantidade_ajustada: number
          tipo: string
          usuario_id: string
        }
        Update: {
          codigo_produto?: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          observacao?: string | null
          produto_id?: string | null
          quantidade_ajustada?: number
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_vendas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          code: string
          description: string
          ean: string | null
          id: string
          last_activity: string
          quantity: number
          threshold: number
        }
        Insert: {
          code: string
          description: string
          ean?: string | null
          id?: string
          last_activity: string
          quantity: number
          threshold: number
        }
        Update: {
          code?: string
          description?: string
          ean?: string | null
          id?: string
          last_activity?: string
          quantity?: number
          threshold?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banco: string | null
          cargo: string | null
          chave_pix: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          nome_completo: string | null
          role: string | null
        }
        Insert: {
          banco?: string | null
          cargo?: string | null
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo?: string | null
          role?: string | null
        }
        Update: {
          banco?: string | null
          cargo?: string | null
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo?: string | null
          role?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          value?: Json | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: string
          new_quantity: number
          product_code: string
          product_description: string
          product_id: string
          quantity_change: number
          timestamp: string
          type: Database["public"]["Enums"]["movement_type"]
          user_email: string
        }
        Insert: {
          id?: string
          new_quantity: number
          product_code: string
          product_description: string
          product_id: string
          quantity_change: number
          timestamp: string
          type: Database["public"]["Enums"]["movement_type"]
          user_email: string
        }
        Update: {
          id?: string
          new_quantity?: number
          product_code?: string
          product_description?: string
          product_id?: string
          quantity_change?: number
          timestamp?: string
          type?: Database["public"]["Enums"]["movement_type"]
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_records: {
        Row: {
          created_at: string
          id: string
          images_urls: string[] | null
          notes: string | null
          product_id: string
          quantity_wasted: number
          reason: string
          user_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          images_urls?: string[] | null
          notes?: string | null
          product_id: string
          quantity_wasted: number
          reason: string
          user_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          images_urls?: string[] | null
          notes?: string | null
          product_id?: string
          quantity_wasted?: number
          reason?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_auth_user_if_not_exists: {
        Args: { p_email: string }
        Returns: string
      }
      create_profile_with_cpf: {
        Args: { p_cpf: string; p_nome_completo: string; p_role?: string }
        Returns: Json
      }
      execute_sql: {
        Args: { query: string }
        Returns: Json
      }
      get_top_selling_products: {
        Args: { limit_count: number }
        Returns: {
          code: string
          id: string
          name: string
          total_sold: number
        }[]
      }
      get_unsold_products: {
        Args: { days_threshold: number }
        Returns: {
          code: string
          id: string
          last_sold_at: string
          name: string
          quantity: number
        }[]
      }
      is_admin: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      register_sale_and_update_stock: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_vendedor_id: string
        }
        Returns: undefined
      }
      register_waste_and_update_stock: {
        Args: {
          p_images?: string[]
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_reason: string
          p_user_email?: string
        }
        Returns: Json
      }
      register_waste_transaction: {
        Args: {
          p_image_urls: string[]
          p_notes: string
          p_product_id: string
          p_quantity_wasted: number
          p_reason: string
          p_user_email: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      movement_type: "initial" | "add" | "remove" | "waste"
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
      movement_type: ["initial", "add", "remove", "waste"],
    },
  },
} as const
