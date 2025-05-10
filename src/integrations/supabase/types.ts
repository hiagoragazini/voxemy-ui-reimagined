export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          ai_model: string | null
          category: string
          conversation_prompt: string | null
          created_at: string
          default_greeting: string | null
          description: string | null
          id: string
          instructions: string | null
          knowledge: string | null
          max_response_length: number | null
          name: string
          phone_number: string | null
          response_style: string | null
          status: string | null
          updated_at: string
          voice_id: string
          webhook_url: string | null
        }
        Insert: {
          ai_model?: string | null
          category: string
          conversation_prompt?: string | null
          created_at?: string
          default_greeting?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          knowledge?: string | null
          max_response_length?: number | null
          name: string
          phone_number?: string | null
          response_style?: string | null
          status?: string | null
          updated_at?: string
          voice_id: string
          webhook_url?: string | null
        }
        Update: {
          ai_model?: string | null
          category?: string
          conversation_prompt?: string | null
          created_at?: string
          default_greeting?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          knowledge?: string | null
          max_response_length?: number | null
          name?: string
          phone_number?: string | null
          response_style?: string | null
          status?: string | null
          updated_at?: string
          voice_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      business_info: {
        Row: {
          business_area: string
          common_objections: string
          company_name: string
          created_at: string
          id: string
          main_benefits: string
          products_services: string
          sales_arguments: string
          tone_of_voice: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_area: string
          common_objections: string
          company_name: string
          created_at?: string
          id?: string
          main_benefits: string
          products_services: string
          sales_arguments: string
          tone_of_voice: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_area?: string
          common_objections?: string
          company_name?: string
          created_at?: string
          id?: string
          main_benefits?: string
          products_services?: string
          sales_arguments?: string
          tone_of_voice?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          agent_id: string | null
          avg_call_duration: string | null
          completed_leads: number | null
          created_at: string
          end_date: string | null
          id: string
          name: string
          origin_phone: string | null
          start_date: string | null
          status: string
          success_rate: number | null
          total_leads: number | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          avg_call_duration?: string | null
          completed_leads?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          origin_phone?: string | null
          start_date?: string | null
          status?: string
          success_rate?: number | null
          total_leads?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          avg_call_duration?: string | null
          completed_leads?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          origin_phone?: string | null
          start_date?: string | null
          status?: string
          success_rate?: number | null
          total_leads?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          call_duration: string | null
          call_result: string | null
          campaign_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          status: string | null
          updated_at: string
        }
        Insert: {
          call_duration?: string | null
          call_result?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          call_duration?: string | null
          call_result?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
