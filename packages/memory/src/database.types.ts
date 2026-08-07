// Tipos gerados do schema Supabase (não editar à mão).
// Regenerar: Supabase MCP generate_typescript_types, ou
//   supabase gen types typescript --project-id zkldxpwufkaadnmvgjab
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: Database["public"]["Enums"]["actor_kind"]
          actor_ref: string | null
          created_at: string
          device_id: string | null
          id: string
          metadata: Json
          target: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor: Database["public"]["Enums"]["actor_kind"]
          actor_ref?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          metadata?: Json
          target?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor?: Database["public"]["Enums"]["actor_kind"]
          actor_ref?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          metadata?: Json
          target?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "authorized_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_devices: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string | null
          name: string
          platform: string | null
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          name: string
          platform?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          name?: string
          platform?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facts: {
        Row: {
          confidence: number
          created_at: string
          id: string
          object: string
          predicate: string
          sensitivity: Database["public"]["Enums"]["data_sensitivity"]
          source: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          object: string
          predicate: string
          sensitivity?: Database["public"]["Enums"]["data_sensitivity"]
          source?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          object?: string
          predicate?: string
          sensitivity?: Database["public"]["Enums"]["data_sensitivity"]
          source?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          sensitivity: Database["public"]["Enums"]["data_sensitivity"]
          source: string | null
          source_ref: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          sensitivity?: Database["public"]["Enums"]["data_sensitivity"]
          source?: string | null
          source_ref?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          sensitivity?: Database["public"]["Enums"]["data_sensitivity"]
          source?: string | null
          source_ref?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          role: string
          sensitivity: Database["public"]["Enums"]["data_sensitivity"]
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          role: string
          sensitivity?: Database["public"]["Enums"]["data_sensitivity"]
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          role?: string
          sensitivity?: Database["public"]["Enums"]["data_sensitivity"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_memory_chunks: {
        Args: {
          filter_user_id: string
          match_count?: number
          min_similarity?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source: string
        }[]
      }
    }
    Enums: {
      actor_kind: "user" | "core" | "worker" | "agent"
      data_sensitivity: "public" | "internal" | "sensitive" | "secret"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
