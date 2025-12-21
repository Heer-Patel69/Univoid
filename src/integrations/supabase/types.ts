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
      admin_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          status?: string
        }
        Relationships: []
      }
      blocked_email_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string | null
          category: string | null
          condition: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_urls: string[] | null
          is_sold: boolean
          price: number | null
          seller_address: string
          seller_email: string
          seller_mobile: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_sold?: boolean
          price?: number | null
          seller_address: string
          seller_email: string
          seller_mobile: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_sold?: boolean
          price?: number | null
          seller_address?: string
          seller_email?: string
          seller_mobile?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      check_in_audit_log: {
        Row: {
          action: string
          created_at: string | null
          device_fingerprint: string | null
          event_id: string
          id: string
          ip_address: string | null
          metadata: Json | null
          organizer_id: string
          ticket_id: string
          user_agent: string | null
          verification_method: string
        }
        Insert: {
          action: string
          created_at?: string | null
          device_fingerprint?: string | null
          event_id: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organizer_id: string
          ticket_id: string
          user_agent?: string | null
          verification_method: string
        }
        Update: {
          action?: string
          created_at?: string | null
          device_fingerprint?: string | null
          event_id?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organizer_id?: string
          ticket_id?: string
          user_agent?: string | null
          verification_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          created_at: string
          event_alerts: boolean
          id: string
          interest_based_alerts: boolean | null
          location_based_alerts: boolean | null
          scholarship_alerts: boolean
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          created_at?: string
          event_alerts?: boolean
          id?: string
          interest_based_alerts?: boolean | null
          location_based_alerts?: boolean | null
          scholarship_alerts?: boolean
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          created_at?: string
          event_alerts?: boolean
          id?: string
          interest_based_alerts?: boolean | null
          location_based_alerts?: boolean | null
          scholarship_alerts?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          component_name: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          page_route: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          page_route?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          page_route?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_materials: {
        Row: {
          created_at: string
          downloads_count: number
          event_id: string
          file_type: string
          file_url: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          downloads_count?: number
          event_id: string
          file_type: string
          file_url: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          downloads_count?: number
          event_id?: string
          file_type?: string
          file_url?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_materials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          custom_data: Json | null
          event_id: string
          id: string
          payment_screenshot_url: string | null
          payment_status: Database["public"]["Enums"]["ticket_status"]
          reviewed_at: string | null
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_data?: Json | null
          event_id: string
          id?: string
          payment_screenshot_url?: string | null
          payment_status?: Database["public"]["Enums"]["ticket_status"]
          reviewed_at?: string | null
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_data?: Json | null
          event_id?: string
          id?: string
          payment_screenshot_url?: string | null
          payment_status?: Database["public"]["Enums"]["ticket_status"]
          reviewed_at?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          abuse_flag: boolean | null
          created_at: string
          device_fingerprint: string | null
          event_id: string
          id: string
          is_used: boolean
          last_scan_attempt: string | null
          qr_code: string
          registration_id: string
          scan_attempts: number | null
          token_hash: string | null
          used_at: string | null
          used_by: string | null
          user_id: string
          verification_method: string | null
        }
        Insert: {
          abuse_flag?: boolean | null
          created_at?: string
          device_fingerprint?: string | null
          event_id: string
          id?: string
          is_used?: boolean
          last_scan_attempt?: string | null
          qr_code: string
          registration_id: string
          scan_attempts?: number | null
          token_hash?: string | null
          used_at?: string | null
          used_by?: string | null
          user_id: string
          verification_method?: string | null
        }
        Update: {
          abuse_flag?: boolean | null
          created_at?: string
          device_fingerprint?: string | null
          event_id?: string
          id?: string
          is_used?: boolean
          last_scan_attempt?: string | null
          qr_code?: string
          registration_id?: string
          scan_attempts?: number | null
          token_hash?: string | null
          used_at?: string | null
          used_by?: string | null
          user_id?: string
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          custom_fields: Json | null
          description: string | null
          end_date: string | null
          event_type: string
          flyer_url: string | null
          id: string
          is_location_decided: boolean
          is_paid: boolean
          maps_link: string | null
          max_capacity: number | null
          organizer_id: string
          price: number | null
          registrations_count: number
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          terms_conditions: string | null
          title: string
          updated_at: string
          upi_qr_url: string | null
          upi_vpa: string | null
          venue_address: string | null
          venue_name: string | null
          views_count: number
        }
        Insert: {
          category: string
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          event_type: string
          flyer_url?: string | null
          id?: string
          is_location_decided?: boolean
          is_paid?: boolean
          maps_link?: string | null
          max_capacity?: number | null
          organizer_id: string
          price?: number | null
          registrations_count?: number
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          terms_conditions?: string | null
          title: string
          updated_at?: string
          upi_qr_url?: string | null
          upi_vpa?: string | null
          venue_address?: string | null
          venue_name?: string | null
          views_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          flyer_url?: string | null
          id?: string
          is_location_decided?: boolean
          is_paid?: boolean
          maps_link?: string | null
          max_capacity?: number | null
          organizer_id?: string
          price?: number | null
          registrations_count?: number
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          terms_conditions?: string | null
          title?: string
          updated_at?: string
          upi_qr_url?: string | null
          upi_vpa?: string | null
          venue_address?: string | null
          venue_name?: string | null
          views_count?: number
        }
        Relationships: []
      }
      lookup_branches: {
        Row: {
          created_at: string
          id: string
          is_popular: boolean | null
          name: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      lookup_cities: {
        Row: {
          created_at: string
          id: string
          is_popular: boolean | null
          name: string
          state_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name: string
          state_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name?: string
          state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookup_cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "lookup_states"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_states: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_popular: boolean | null
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name?: string
        }
        Relationships: []
      }
      lookup_universities: {
        Row: {
          city_id: string | null
          created_at: string
          id: string
          is_popular: boolean | null
          name: string
          state_id: string | null
          type: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name: string
          state_id?: string | null
          type?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean | null
          name?: string
          state_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookup_universities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "lookup_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lookup_universities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "lookup_states"
            referencedColumns: ["id"]
          },
        ]
      }
      material_likes: {
        Row: {
          created_at: string
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_likes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          admin_previewed: boolean | null
          branch: string | null
          college: string | null
          course: string | null
          created_at: string
          created_by: string
          description: string | null
          downloads_count: number
          file_hash: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          language: string | null
          likes_count: number
          preview_file_url: string | null
          preview_page_limit: number | null
          preview_ready: boolean | null
          shares_count: number
          status: Database["public"]["Enums"]["content_status"]
          subject: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          admin_previewed?: boolean | null
          branch?: string | null
          college?: string | null
          course?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          downloads_count?: number
          file_hash?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          language?: string | null
          likes_count?: number
          preview_file_url?: string | null
          preview_page_limit?: number | null
          preview_ready?: boolean | null
          shares_count?: number
          status?: Database["public"]["Enums"]["content_status"]
          subject?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          admin_previewed?: boolean | null
          branch?: string | null
          college?: string | null
          course?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          downloads_count?: number
          file_hash?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          language?: string | null
          likes_count?: number
          preview_file_url?: string | null
          preview_page_limit?: number | null
          preview_ready?: boolean | null
          shares_count?: number
          status?: Database["public"]["Enums"]["content_status"]
          subject?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          external_link: string | null
          id: string
          image_urls: string[] | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          external_link?: string | null
          id?: string
          image_urls?: string[] | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          external_link?: string | null
          id?: string
          image_urls?: string[] | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_applications: {
        Row: {
          created_at: string
          id: string
          proof_url: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["organizer_application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proof_url: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["organizer_application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proof_url?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["organizer_application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_otp_codes: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          user_id: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          user_id: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: string | null
          city: string | null
          college_name: string | null
          course_stream: string | null
          created_at: string
          current_year: number | null
          degree: string | null
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          interests: string[] | null
          is_disabled: boolean
          mobile_number: string | null
          phone_verified: boolean | null
          profile_complete: boolean | null
          profile_photo_url: string | null
          state: string | null
          total_xp: number
          updated_at: string
          year_semester: string | null
        }
        Insert: {
          branch?: string | null
          city?: string | null
          college_name?: string | null
          course_stream?: string | null
          created_at?: string
          current_year?: number | null
          degree?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          id: string
          interests?: string[] | null
          is_disabled?: boolean
          mobile_number?: string | null
          phone_verified?: boolean | null
          profile_complete?: boolean | null
          profile_photo_url?: string | null
          state?: string | null
          total_xp?: number
          updated_at?: string
          year_semester?: string | null
        }
        Update: {
          branch?: string | null
          city?: string | null
          college_name?: string | null
          course_stream?: string | null
          created_at?: string
          current_year?: number | null
          degree?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          interests?: string[] | null
          is_disabled?: boolean
          mobile_number?: string | null
          phone_verified?: boolean | null
          profile_complete?: boolean | null
          profile_photo_url?: string | null
          state?: string | null
          total_xp?: number
          updated_at?: string
          year_semester?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          joined_at: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          project_id: string
          reviewed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          project_id: string
          reviewed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string
          reviewed_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          project_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_open: boolean | null
          linked_event_id: string | null
          max_members: number | null
          owner_id: string
          skills_required: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean | null
          linked_event_id?: string | null
          max_members?: number | null
          owner_id: string
          skills_required?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean | null
          linked_event_id?: string | null
          max_members?: number | null
          owner_id?: string
          skills_required?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          reasons: string[]
          reported_user_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          comment?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reasons: string[]
          reported_user_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          comment?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reasons?: string[]
          reported_user_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      scholarship_reminders: {
        Row: {
          created_at: string
          id: string
          remind_days_before: number
          reminder_sent: boolean
          scholarship_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          remind_days_before?: number
          reminder_sent?: boolean
          scholarship_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          remind_days_before?: number
          reminder_sent?: boolean
          scholarship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_reminders_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          application_link: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          deadline_status: string | null
          description: string | null
          eligible_categories: string[] | null
          eligible_courses: string[] | null
          eligible_states: string[] | null
          id: string
          is_all_india: boolean | null
          official_source: boolean | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_domain: string | null
          source_name: string
          source_url: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_link?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deadline_status?: string | null
          description?: string | null
          eligible_categories?: string[] | null
          eligible_courses?: string[] | null
          eligible_states?: string[] | null
          id?: string
          is_all_india?: boolean | null
          official_source?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_domain?: string | null
          source_name: string
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_link?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deadline_status?: string | null
          description?: string | null
          eligible_categories?: string[] | null
          eligible_courses?: string[] | null
          eligible_states?: string[] | null
          id?: string
          is_all_india?: boolean | null
          official_source?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_domain?: string | null
          source_name?: string
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_bids: {
        Row: {
          created_at: string
          id: string
          message: string | null
          solver_id: string
          status: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          solver_id: string
          status?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          solver_id?: string
          status?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_bids_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      task_requests: {
        Row: {
          assigned_to: string | null
          attachment_urls: string[] | null
          budget: number | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_negotiable: boolean | null
          page_count: number | null
          requester_id: string
          status: string | null
          subject: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachment_urls?: string[] | null
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_negotiable?: boolean | null
          page_count?: number | null
          requester_id: string
          status?: string | null
          subject?: string | null
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachment_urls?: string[] | null
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_negotiable?: boolean | null
          page_count?: number | null
          requester_id?: string
          status?: string | null
          subject?: string | null
          task_type?: string
          title?: string
          updated_at?: string
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
      xp_transactions: {
        Row: {
          amount: number
          content_id: string | null
          content_type: string | null
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_profiles: {
        Row: {
          college_name: string | null
          full_name: string | null
          id: string | null
          profile_photo_url: string | null
          total_xp: number | null
        }
        Insert: {
          college_name?: string | null
          full_name?: string | null
          id?: string | null
          profile_photo_url?: string | null
          total_xp?: number | null
        }
        Update: {
          college_name?: string | null
          full_name?: string | null
          id?: string | null
          profile_photo_url?: string | null
          total_xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_organizer: {
        Args: { admin_id: string; application_id: string }
        Returns: undefined
      }
      auto_expire_scholarships: { Args: never; Returns: undefined }
      award_xp: {
        Args: {
          _amount: number
          _content_id?: string
          _content_type?: string
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      create_secure_ticket: {
        Args: {
          p_event_id: string
          p_registration_id: string
          p_user_id: string
        }
        Returns: string
      }
      generate_secure_ticket_token: { Args: never; Returns: string }
      generate_ticket_qr: { Args: never; Returns: string }
      get_book_by_id_safe: {
        Args: { p_book_id: string }
        Returns: {
          author: string
          category: string
          condition: string
          created_at: string
          created_by: string
          description: string
          id: string
          image_urls: string[]
          is_sold: boolean
          price: number
          seller_address: string
          seller_email: string
          seller_mobile: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }[]
      }
      get_book_recommendations: {
        Args: { p_book_id: string; p_limit?: number }
        Returns: {
          author: string | null
          category: string | null
          condition: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_urls: string[] | null
          is_sold: boolean
          price: number | null
          seller_address: string
          seller_email: string
          seller_mobile: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "books"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_books_safe: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: Database["public"]["Enums"]["content_status"]
        }
        Returns: {
          author: string
          category: string
          condition: string
          created_at: string
          created_by: string
          description: string
          id: string
          image_urls: string[]
          is_sold: boolean
          price: number
          seller_address: string
          seller_email: string
          seller_mobile: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }[]
      }
      get_contributor_name: { Args: { user_id: string }; Returns: string }
      get_event_registrations_with_profiles: {
        Args: { p_event_id: string }
        Returns: {
          college_name: string
          created_at: string
          custom_data: Json
          email: string
          full_name: string
          mobile_number: string
          payment_screenshot_url: string
          payment_status: string
          profile_photo_url: string
          registration_id: string
          reviewed_at: string
          user_id: string
        }[]
      }
      get_homepage_stats: { Args: never; Returns: Json }
      get_public_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          full_name: string
          id: string
          profile_photo_url: string
          total_xp: number
        }[]
      }
      get_registered_users_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_book_views: { Args: { book_id: string }; Returns: undefined }
      increment_material_downloads: {
        Args: { material_id: string }
        Returns: undefined
      }
      increment_material_shares: {
        Args: { material_id: string }
        Returns: undefined
      }
      increment_material_views: {
        Args: { material_id: string }
        Returns: undefined
      }
      is_admin_or_assistant: { Args: { _user_id: string }; Returns: boolean }
      is_email_blocked: { Args: { p_email: string }; Returns: boolean }
      secure_check_in: {
        Args: {
          p_device_fingerprint?: string
          p_event_id: string
          p_organizer_id: string
          p_qr_code: string
          p_verification_method?: string
        }
        Returns: Json
      }
      toggle_material_like: {
        Args: { p_material_id: string }
        Returns: boolean
      }
      user_has_liked_material: {
        Args: { p_material_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "organizer" | "admin_assistant"
      content_status: "pending" | "approved" | "rejected"
      event_status: "draft" | "published" | "cancelled" | "completed"
      organizer_application_status: "pending" | "approved" | "rejected"
      ticket_status: "pending" | "approved" | "rejected" | "used"
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
      app_role: ["admin", "student", "organizer", "admin_assistant"],
      content_status: ["pending", "approved", "rejected"],
      event_status: ["draft", "published", "cancelled", "completed"],
      organizer_application_status: ["pending", "approved", "rejected"],
      ticket_status: ["pending", "approved", "rejected", "used"],
    },
  },
} as const
