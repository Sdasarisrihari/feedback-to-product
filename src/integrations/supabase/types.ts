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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysed_at: string
          duration_ms: number
          input_count: number
          insights: Json
          model: string
          notes: string
          owner_id: string
          run_id: string
          signature: string
          truncated: boolean
          updated_at: string
        }
        Insert: {
          analysed_at: string
          duration_ms: number
          input_count: number
          insights: Json
          model: string
          notes?: string
          owner_id?: string
          run_id: string
          signature: string
          truncated?: boolean
          updated_at?: string
        }
        Update: {
          analysed_at?: string
          duration_ms?: number
          input_count?: number
          insights?: Json
          model?: string
          notes?: string
          owner_id?: string
          run_id?: string
          signature?: string
          truncated?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_prds: {
        Row: {
          created_at: string
          id: string
          model: string
          owner_id: string
          review: string
          sources: Json
          theme_id: string
          theme_name: string
          updated_at: string
        }
        Insert: {
          created_at: string
          id: string
          model: string
          owner_id?: string
          review?: string
          sources: Json
          theme_id: string
          theme_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          owner_id?: string
          review?: string
          sources?: Json
          theme_id?: string
          theme_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      analysis_runs: {
        Row: {
          duration_ms: number
          id: string
          method: string
          model: string | null
          owner_id: string
          ran_at: string
          record_count: number
          status: string
          theme_count: number
        }
        Insert: {
          duration_ms: number
          id: string
          method: string
          model?: string | null
          owner_id?: string
          ran_at: string
          record_count: number
          status?: string
          theme_count: number
        }
        Update: {
          duration_ms?: number
          id?: string
          method?: string
          model?: string | null
          owner_id?: string
          ran_at?: string
          record_count?: number
          status?: string
          theme_count?: number
        }
        Relationships: []
      }
      doc_sections: {
        Row: {
          body: string
          doc_id: string
          heading: string
          id: string
          owner_id: string
          page: number | null
          position: number
          suspected_injection: boolean
        }
        Insert: {
          body: string
          doc_id: string
          heading: string
          id: string
          owner_id?: string
          page?: number | null
          position: number
          suspected_injection?: boolean
        }
        Update: {
          body?: string
          doc_id?: string
          heading?: string
          id?: string
          owner_id?: string
          page?: number | null
          position?: number
          suspected_injection?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "doc_sections_owner_id_doc_id_fkey"
            columns: ["owner_id", "doc_id"]
            isOneToOne: false
            referencedRelation: "product_docs"
            referencedColumns: ["owner_id", "id"]
          },
        ]
      }
      draft_tasks: {
        Row: {
          acceptance: Json
          description: string
          evidence_ids: string[]
          id: string
          owner_id: string
          reviewed_at: string | null
          status: string
          theme_id: string
          title: string
          updated_at: string
        }
        Insert: {
          acceptance?: Json
          description: string
          evidence_ids?: string[]
          id: string
          owner_id?: string
          reviewed_at?: string | null
          status?: string
          theme_id: string
          title: string
          updated_at?: string
        }
        Update: {
          acceptance?: Json
          description?: string
          evidence_ids?: string[]
          id?: string
          owner_id?: string
          reviewed_at?: string | null
          status?: string
          theme_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_records: {
        Row: {
          body: string
          duplicate_of: string | null
          feedback_date: string
          id: string
          import_id: string
          line: number
          owner_id: string
          rating: number | null
          segment: string
          source: string
          suspected_injection: boolean
          updated_at: string
          warnings: Json
        }
        Insert: {
          body: string
          duplicate_of?: string | null
          feedback_date?: string
          id: string
          import_id: string
          line: number
          owner_id?: string
          rating?: number | null
          segment?: string
          source?: string
          suspected_injection?: boolean
          updated_at?: string
          warnings?: Json
        }
        Update: {
          body?: string
          duplicate_of?: string | null
          feedback_date?: string
          id?: string
          import_id?: string
          line?: number
          owner_id?: string
          rating?: number | null
          segment?: string
          source?: string
          suspected_injection?: boolean
          updated_at?: string
          warnings?: Json
        }
        Relationships: []
      }
      import_runs: {
        Row: {
          accepted: number
          duplicates: number
          fatal_error: string | null
          filename: string
          id: string
          imported_at: string
          owner_id: string
          rejected: Json
          total: number
          updated_at: string
          warnings: number
        }
        Insert: {
          accepted: number
          duplicates: number
          fatal_error?: string | null
          filename: string
          id: string
          imported_at: string
          owner_id?: string
          rejected?: Json
          total: number
          updated_at?: string
          warnings: number
        }
        Update: {
          accepted?: number
          duplicates?: number
          fatal_error?: string | null
          filename?: string
          id?: string
          imported_at?: string
          owner_id?: string
          rejected?: Json
          total?: number
          updated_at?: string
          warnings?: number
        }
        Relationships: []
      }
      prd_revisions: {
        Row: {
          author: string
          content: Json
          created_at: string
          owner_id: string
          prd_id: string
          report: Json | null
          rev_no: number
        }
        Insert: {
          author: string
          content: Json
          created_at: string
          owner_id?: string
          prd_id: string
          report?: Json | null
          rev_no: number
        }
        Update: {
          author?: string
          content?: Json
          created_at?: string
          owner_id?: string
          prd_id?: string
          report?: Json | null
          rev_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "prd_revisions_owner_id_prd_id_fkey"
            columns: ["owner_id", "prd_id"]
            isOneToOne: false
            referencedRelation: "ai_prds"
            referencedColumns: ["owner_id", "id"]
          },
        ]
      }
      product_docs: {
        Row: {
          filename: string
          id: string
          imported_at: string
          kind: string
          owner_id: string
          title: string
          updated_at: string
          version: string
          warnings: Json
        }
        Insert: {
          filename: string
          id: string
          imported_at: string
          kind: string
          owner_id?: string
          title: string
          updated_at?: string
          version?: string
          warnings?: Json
        }
        Update: {
          filename?: string
          id?: string
          imported_at?: string
          kind?: string
          owner_id?: string
          title?: string
          updated_at?: string
          version?: string
          warnings?: Json
        }
        Relationships: []
      }
      workspace_settings: {
        Row: {
          browser_import_done: boolean
          effort: Json
          owner_id: string
          updated_at: string
          weights: Json
        }
        Insert: {
          browser_import_done?: boolean
          effort?: Json
          owner_id?: string
          updated_at?: string
          weights: Json
        }
        Update: {
          browser_import_done?: boolean
          effort?: Json
          owner_id?: string
          updated_at?: string
          weights?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
