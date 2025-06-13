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
          assistant_id: string | null
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
          type: string | null
          updated_at: string
          voice_id: string | null
          webhook_url: string | null
        }
        Insert: {
          ai_model?: string | null
          assistant_id?: string | null
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
          type?: string | null
          updated_at?: string
          voice_id?: string | null
          webhook_url?: string | null
        }
        Update: {
          ai_model?: string | null
          assistant_id?: string | null
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
          type?: string | null
          updated_at?: string
          voice_id?: string | null
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
      call_logs: {
        Row: {
          agent_id: string | null
          call_analysis: Json | null
          call_sid: string
          campaign_id: string | null
          conversation_log: Json | null
          conversation_relay_active: boolean | null
          created_at: string
          duration: number | null
          from_number: string | null
          id: number
          lead_id: string | null
          recorded_at: string
          status: string
          to_number: string | null
          transcription: string | null
          transcription_status: string | null
          websocket_url: string | null
        }
        Insert: {
          agent_id?: string | null
          call_analysis?: Json | null
          call_sid: string
          campaign_id?: string | null
          conversation_log?: Json | null
          conversation_relay_active?: boolean | null
          created_at?: string
          duration?: number | null
          from_number?: string | null
          id?: number
          lead_id?: string | null
          recorded_at?: string
          status: string
          to_number?: string | null
          transcription?: string | null
          transcription_status?: string | null
          websocket_url?: string | null
        }
        Update: {
          agent_id?: string | null
          call_analysis?: Json | null
          call_sid?: string
          campaign_id?: string | null
          conversation_log?: Json | null
          conversation_relay_active?: boolean | null
          created_at?: string
          duration?: number | null
          from_number?: string | null
          id?: number
          lead_id?: string | null
          recorded_at?: string
          status?: string
          to_number?: string | null
          transcription?: string | null
          transcription_status?: string | null
          websocket_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      call_recordings: {
        Row: {
          agent_id: string | null
          call_sid: string
          campaign_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          lead_id: string | null
          processed_at: string | null
          recording_sid: string
          recording_url: string
          sentiment: string | null
          transcription: string | null
        }
        Insert: {
          agent_id?: string | null
          call_sid: string
          campaign_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          processed_at?: string | null
          recording_sid: string
          recording_url: string
          sentiment?: string | null
          transcription?: string | null
        }
        Update: {
          agent_id?: string | null
          call_sid?: string
          campaign_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          processed_at?: string | null
          recording_sid?: string
          recording_url?: string
          sentiment?: string | null
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_recordings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_recordings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_recordings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          recording_sid: string | null
          recording_url: string | null
          sentiment: string | null
          status: string | null
          transcription: string | null
          updated_at: string
        }
        Insert: {
          call_duration?: string | null
          call_result?: string | null
          campaign_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          recording_sid?: string | null
          recording_url?: string | null
          sentiment?: string | null
          status?: string | null
          transcription?: string | null
          updated_at?: string
        }
        Update: {
          call_duration?: string | null
          call_result?: string | null
          campaign_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          recording_sid?: string | null
          recording_url?: string | null
          sentiment?: string | null
          status?: string | null
          transcription?: string | null
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
      whatsapp_connections: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          instance_id: string | null
          last_connected_at: string | null
          phone_number: string | null
          qr_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          instance_id?: string | null
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          instance_id?: string | null
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          agent_id: string
          created_at: string
          direction: string
          from_number: string
          id: string
          message_text: string | null
          message_type: string
          status: string
          to_number: string
          updated_at: string
          whatsapp_message_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          direction: string
          from_number: string
          id?: string
          message_text?: string | null
          message_type?: string
          status?: string
          to_number: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          direction?: string
          from_number?: string
          id?: string
          message_text?: string | null
          message_type?: string
          status?: string
          to_number?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_extensions: {
        Args: { extension_names: string[] }
        Returns: {
          name: string
          installed: boolean
        }[]
      }
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      setup_campaign_executor_cron: {
        Args: {
          schedule_interval: string
          max_calls: number
          function_url: string
          auth_token: string
        }
        Returns: string
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
