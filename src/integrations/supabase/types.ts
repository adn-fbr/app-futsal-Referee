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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          email: string
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          email: string
          id?: string
          ip_address?: unknown
          success: boolean
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_event_logs: {
        Row: {
          created_at: string
          event: string
          id: string
          identifier_hash: string | null
          metadata: Json | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          identifier_hash?: string | null
          metadata?: Json | null
          success: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          identifier_hash?: string | null
          metadata?: Json | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      card_verification_logs: {
        Row: {
          card_id: string
          id: string
          ip_address: string | null
          location: string | null
          user_agent: string | null
          verified_at: string | null
        }
        Insert: {
          card_id: string
          id?: string
          ip_address?: string | null
          location?: string | null
          user_agent?: string | null
          verified_at?: string | null
        }
        Update: {
          card_id?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          user_agent?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_verification_logs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "referee_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_solution: boolean | null
          parent_reply_id: string | null
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          parent_reply_id?: string | null
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          parent_reply_id?: string | null
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "discussion_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "discussion_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_topics: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          last_activity_at: string | null
          law_reference: string | null
          replies_count: number | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id: string
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_activity_at?: string | null
          law_reference?: string | null
          replies_count?: number | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_activity_at?: string | null
          law_reference?: string | null
          replies_count?: number | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      evaluation_criteria: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          weight: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          weight?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          weight?: number
        }
        Relationships: []
      }
      evaluation_scores: {
        Row: {
          created_at: string | null
          criteria_id: string
          evaluation_id: string
          id: string
          notes: string | null
          score: number
        }
        Insert: {
          created_at?: string | null
          criteria_id: string
          evaluation_id: string
          id?: string
          notes?: string | null
          score: number
        }
        Update: {
          created_at?: string | null
          criteria_id?: string
          evaluation_id?: string
          id?: string
          notes?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          created_at: string | null
          evaluator_id: string | null
          event_id: string | null
          id: string
          notes: string | null
          referee_id: string
          status: string | null
          submitted_at: string | null
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evaluator_id?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          referee_id: string
          status?: string | null
          submitted_at?: string | null
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evaluator_id?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          referee_id?: string
          status?: string | null
          submitted_at?: string | null
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "active_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_approvals: {
        Row: {
          action: string | null
          approved_by: string | null
          approver_id: string | null
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          action?: string | null
          approved_by?: string | null
          approver_id?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          action?: string | null
          approved_by?: string | null
          approver_id?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assignments: {
        Row: {
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string | null
          deleted_at: string | null
          event_id: string
          id: string
          referee_id: string
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          event_id: string
          id?: string
          referee_id: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          event_id?: string
          id?: string
          referee_id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "active_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          action: string
          created_at: string | null
          event_id: string | null
          from_status: string | null
          id: string
          performed_by: string | null
          to_status: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          event_id?: string | null
          from_status?: string | null
          id?: string
          performed_by?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          event_id?: string | null
          from_status?: string | null
          id?: string
          performed_by?: string | null
          to_status?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          date: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          kabupaten_kota_id: string | null
          location: string | null
          name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          kabupaten_kota_id?: string | null
          location?: string | null
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          kabupaten_kota_id?: string | null
          location?: string | null
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_kabupaten_kota_id_fkey"
            columns: ["kabupaten_kota_id"]
            isOneToOne: false
            referencedRelation: "kabupaten_kota"
            referencedColumns: ["id"]
          },
        ]
      }
      honors: {
        Row: {
          amount: number
          created_at: string | null
          deleted_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          referee_id: string
          status: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          deleted_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          referee_id: string
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          deleted_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          referee_id?: string
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "honors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "active_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honors_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honors_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kabupaten_kota: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
          provinsi_id: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          provinsi_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          provinsi_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kabupaten_kota_provinsi_id_fkey"
            columns: ["provinsi_id"]
            isOneToOne: false
            referencedRelation: "provinsi"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_materials: {
        Row: {
          category: string
          content: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          law_number: string | null
          pdf_url: string | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category: string
          content?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          law_number?: string | null
          pdf_url?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          law_number?: string | null
          pdf_url?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          material_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          material_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "learning_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          assignment_enabled: boolean | null
          created_at: string | null
          discussion_enabled: boolean | null
          evaluation_enabled: boolean | null
          event_enabled: boolean | null
          honor_enabled: boolean | null
          id: string
          learning_enabled: boolean | null
          pengurus_enabled: boolean | null
          registration_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_enabled?: boolean | null
          created_at?: string | null
          discussion_enabled?: boolean | null
          evaluation_enabled?: boolean | null
          event_enabled?: boolean | null
          honor_enabled?: boolean | null
          id?: string
          learning_enabled?: boolean | null
          pengurus_enabled?: boolean | null
          registration_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_enabled?: boolean | null
          created_at?: string | null
          discussion_enabled?: boolean | null
          evaluation_enabled?: boolean | null
          event_enabled?: boolean | null
          honor_enabled?: boolean | null
          id?: string
          learning_enabled?: boolean | null
          pengurus_enabled?: boolean | null
          registration_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pengurus: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          jabatan: string
          kabupaten_kota_id: string | null
          level: Database["public"]["Enums"]["pengurus_level"]
          provinsi_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jabatan: string
          kabupaten_kota_id?: string | null
          level: Database["public"]["Enums"]["pengurus_level"]
          provinsi_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          jabatan?: string
          kabupaten_kota_id?: string | null
          level?: Database["public"]["Enums"]["pengurus_level"]
          provinsi_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengurus_kabupaten_kota_id_fkey"
            columns: ["kabupaten_kota_id"]
            isOneToOne: false
            referencedRelation: "kabupaten_kota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengurus_provinsi_id_fkey"
            columns: ["provinsi_id"]
            isOneToOne: false
            referencedRelation: "provinsi"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          afk_origin: string | null
          approved_at: string | null
          approved_by: string | null
          birth_date: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_profile_complete: boolean | null
          kabupaten_kota_id: string | null
          ktp_photo_url: string | null
          license_expiry: string | null
          license_level: string | null
          license_photo_url: string | null
          occupation: string | null
          profile_photo_url: string | null
          registration_status: string | null
          rejected_reason: string | null
          requested_role: string | null
          updated_at: string | null
        }
        Insert: {
          afk_origin?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birth_date?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          is_profile_complete?: boolean | null
          kabupaten_kota_id?: string | null
          ktp_photo_url?: string | null
          license_expiry?: string | null
          license_level?: string | null
          license_photo_url?: string | null
          occupation?: string | null
          profile_photo_url?: string | null
          registration_status?: string | null
          rejected_reason?: string | null
          requested_role?: string | null
          updated_at?: string | null
        }
        Update: {
          afk_origin?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birth_date?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_profile_complete?: boolean | null
          kabupaten_kota_id?: string | null
          ktp_photo_url?: string | null
          license_expiry?: string | null
          license_level?: string | null
          license_photo_url?: string | null
          occupation?: string | null
          profile_photo_url?: string | null
          registration_status?: string | null
          rejected_reason?: string | null
          requested_role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_kabupaten_kota_id_fkey"
            columns: ["kabupaten_kota_id"]
            isOneToOne: false
            referencedRelation: "kabupaten_kota"
            referencedColumns: ["id"]
          },
        ]
      }
      provinsi: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referee_cards: {
        Row: {
          card_number: string
          created_at: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          last_verified_at: string | null
          referee_id: string
          status: string | null
          updated_at: string | null
          verification_code: string
          verification_count: number | null
        }
        Insert: {
          card_number: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_verified_at?: string | null
          referee_id: string
          status?: string | null
          updated_at?: string | null
          verification_code: string
          verification_count?: number | null
        }
        Update: {
          card_number?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_verified_at?: string | null
          referee_id?: string
          status?: string | null
          updated_at?: string | null
          verification_code?: string
          verification_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referee_cards_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referee_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          referee_id: string
          reviewer_name: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          referee_id: string
          reviewer_name?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          referee_id?: string
          reviewer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referee_reviews_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Update: {
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_events: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string | null
          kabupaten_kota_id: string | null
          location: string | null
          name: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          kabupaten_kota_id?: string | null
          location?: string | null
          name?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          kabupaten_kota_id?: string | null
          location?: string | null
          name?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_kabupaten_kota_id_fkey"
            columns: ["kabupaten_kota_id"]
            isOneToOne: false
            referencedRelation: "kabupaten_kota"
            referencedColumns: ["id"]
          },
        ]
      }
      active_honors: {
        Row: {
          amount: number | null
          created_at: string | null
          deleted_at: string | null
          event_id: string | null
          id: string | null
          notes: string | null
          referee_id: string | null
          status: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          event_id?: string | null
          id?: string | null
          notes?: string | null
          referee_id?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          event_id?: string | null
          id?: string | null
          notes?: string | null
          referee_id?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "honors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "active_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honors_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honors_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referee_review_stats: {
        Row: {
          avg_rating: number | null
          referee_id: string | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referee_reviews_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_mark_expired_cards: { Args: never; Returns: Json }
      can_access_region: {
        Args: { _kabupaten_kota_id: string; _user_id: string }
        Returns: boolean
      }
      can_approve_registration: {
        Args: { _admin_id: string; _user_id: string }
        Returns: boolean
      }
      check_duplicate_event: {
        Args: { p_kota_id: string; p_location: string; p_name: string }
        Returns: boolean
      }
      count_referee_cards: {
        Args: { p_search?: string; p_status?: string }
        Returns: number
      }
      count_referees: {
        Args: {
          _is_active?: boolean
          _kabupaten_kota_id?: string
          _license_level?: string
          _search?: string
        }
        Returns: number
      }
      generate_card_number: { Args: { p_referee_id: string }; Returns: string }
      get_accessible_regions: { Args: { _user_id: string }; Returns: string[] }
      get_admin_dashboard_summary: {
        Args: {
          _end_date?: string
          _kabupaten_kota_id?: string
          _start_date?: string
        }
        Returns: {
          active_referees: number
          avg_income_per_referee: number
          completed_events: number
          total_events: number
          total_pending_income: number
          total_referees: number
          total_verified_income: number
        }[]
      }
      get_admin_referee_count: {
        Args: {
          _is_active?: boolean
          _kabupaten_kota_id?: string
          _license_level?: string
          _search?: string
        }
        Returns: number
      }
      get_admin_referees: {
        Args: {
          _is_active?: boolean
          _kabupaten_kota_id?: string
          _license_level?: string
          _limit?: number
          _offset?: number
          _search?: string
        }
        Returns: {
          afk_origin: string
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          is_profile_complete: boolean
          kabupaten_kota_id: string
          license_expiry: string
          license_level: string
          profile_photo_url: string
        }[]
      }
      get_audit_logs: {
        Args: {
          _action?: string
          _actor_id?: string
          _end_date?: string
          _entity_id?: string
          _entity_type?: string
          _limit?: number
          _offset?: number
          _start_date?: string
        }
        Returns: {
          action: string
          actor_id: string
          actor_name: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          new_data: Json
          old_data: Json
        }[]
      }
      get_honor_statistics: {
        Args: { _referee_id?: string }
        Returns: {
          pending_amount: number
          referee_id: string
          total_earned: number
          total_pending: number
          total_rejected: number
          total_verified: number
        }[]
      }
      get_my_referee_event_count: {
        Args: { _end_date?: string; _start_date?: string }
        Returns: {
          cancelled_events: number
          completed_events: number
          pending_events: number
          referee_id: string
          referee_name: string
          total_events: number
        }[]
      }
      get_pending_registrations: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          id: string
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          registration_status: string
          requested_role: string
        }[]
      }
      get_public_referee: {
        Args: { _referee_id: string }
        Returns: {
          afk_origin: string
          full_name: string
          id: string
          is_active: boolean
          kabupaten_kota_name: string
          license_level: string
          profile_photo_url: string
        }[]
      }
      get_public_referees: {
        Args: { _is_active?: boolean; _search?: string }
        Returns: {
          afk_origin: string
          full_name: string
          id: string
          is_active: boolean
          kabupaten_kota_name: string
          license_level: string
          profile_photo_url: string
        }[]
      }
      get_referee_event_count: {
        Args: {
          _end_date?: string
          _kabupaten_kota_id?: string
          _start_date?: string
        }
        Returns: {
          cancelled_events: number
          completed_events: number
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          pending_events: number
          referee_id: string
          referee_name: string
          total_events: number
        }[]
      }
      get_referee_income_summary: {
        Args: {
          _end_date?: string
          _kabupaten_kota_id?: string
          _start_date?: string
        }
        Returns: {
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          pending_count: number
          referee_id: string
          referee_name: string
          rejected_count: number
          total_pending_income: number
          total_verified_income: number
          verified_count: number
        }[]
      }
      get_referee_detail: {
        Args: { p_referee_id: string }
        Returns: Json
      }
      get_referees: {
        Args: {
          _is_active?: boolean
          _kabupaten_kota_id?: string
          _license_level?: string
          _limit?: number
          _offset?: number
          _search?: string
        }
        Returns: {
          afk_origin: string
          birth_date: string
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          is_profile_complete: boolean
          kabupaten_kota_id: string
          license_expiry: string
          license_level: string
          profile_photo_url: string
        }[]
      }
      get_registration_history: {
        Args: never
        Returns: {
          approved_at: string
          approved_by: string
          approver_name: string
          created_at: string
          full_name: string
          id: string
          kabupaten_kota_id: string
          kabupaten_kota_name: string
          registration_status: string
          rejected_reason: string
          requested_role: string
        }[]
      }
      get_user_kabupaten_kota: { Args: { _user_id: string }; Returns: string }
      get_user_kabupaten_kota_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_schedule_conflict: {
        Args: { _event_id: string; _referee_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_kab_kota: { Args: { _user_id: string }; Returns: boolean }
      is_admin_provinsi: { Args: { _user_id: string }; Returns: boolean }
      is_event_approved: { Args: { _event_id: string }; Returns: boolean }
      is_referee_active: { Args: { _referee_id: string }; Returns: boolean }
      is_same_region: {
        Args: { _kabupaten_kota_id: string; _user_id: string }
        Returns: boolean
      }
      search_referee_cards:
        | {
            Args: {
              p_limit?: number
              p_offset?: number
              p_search?: string
              p_status?: string
            }
            Returns: {
              afk_origin: string
              card_number: string
              created_at: string
              expires_at: string
              full_name: string
              id: string
              is_active: boolean
              issued_at: string
              kabupaten_kota_name: string
              last_verified_at: string
              license_expiry: string
              license_level: string
              profile_photo_url: string
              referee_id: string
              status: string
              updated_at: string
              verification_count: number
            }[]
          }
        | {
            Args: {
              is_active?: boolean
              license_level?: string
              page?: number
              page_size?: number
              search?: string
            }
            Returns: {
              created_at: string
              full_name: string
              id: string
              is_active: boolean
              license_level: string
              total_count: number
            }[]
          }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      verify_referee_card: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "admin_provinsi"
        | "admin_kab_kota"
        | "panitia"
        | "wasit"
        | "evaluator"
      pengurus_level: "PROVINSI" | "KAB_KOTA"
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
    Enums: {
      app_role: [
        "admin_provinsi",
        "admin_kab_kota",
        "panitia",
        "wasit",
        "evaluator",
      ],
      pengurus_level: ["PROVINSI", "KAB_KOTA"],
    },
  },
} as const
