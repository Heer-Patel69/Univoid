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
      blogs: {
        Row: {
          content: string
          cover_image_url: string | null
          created_at: string
          created_by: string
          id: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
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
          shares_count: number
          status: Database["public"]["Enums"]["content_status"]
          subject: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
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
          shares_count?: number
          status?: Database["public"]["Enums"]["content_status"]
          subject?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
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
      profiles: {
        Row: {
          college_name: string | null
          course_stream: string | null
          created_at: string
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          is_disabled: boolean
          mobile_number: string | null
          phone_otp_code: string | null
          phone_otp_expires_at: string | null
          phone_verified: boolean | null
          profile_photo_url: string | null
          total_xp: number
          updated_at: string
          year_semester: string | null
        }
        Insert: {
          college_name?: string | null
          course_stream?: string | null
          created_at?: string
          email: string
          email_verified?: boolean | null
          full_name: string
          id: string
          is_disabled?: boolean
          mobile_number?: string | null
          phone_otp_code?: string | null
          phone_otp_expires_at?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          total_xp?: number
          updated_at?: string
          year_semester?: string | null
        }
        Update: {
          college_name?: string | null
          course_stream?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          is_disabled?: boolean
          mobile_number?: string | null
          phone_otp_code?: string | null
          phone_otp_expires_at?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          total_xp?: number
          updated_at?: string
          year_semester?: string | null
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
      generate_ticket_qr: { Args: never; Returns: string }
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
      get_contributor_name: { Args: { user_id: string }; Returns: string }
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
      is_email_blocked: { Args: { p_email: string }; Returns: boolean }
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
      app_role: "admin" | "student" | "organizer"
      content_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "student", "organizer"],
      content_status: ["pending", "approved", "rejected"],
    },
  },
} as const
