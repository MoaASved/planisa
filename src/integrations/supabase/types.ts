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
      calendar_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean
          category_id: string | null
          category_name: string | null
          color: string | null
          created_at: string
          description: string | null
          end_time: string | null
          end_time_text: string | null
          event_date: string | null
          id: string
          start_time: string | null
          time_text: string | null
          title: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          category_id?: string | null
          category_name?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          end_time_text?: string | null
          event_date?: string | null
          id?: string
          start_time?: string | null
          time_text?: string | null
          title: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          category_id?: string | null
          category_name?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          end_time_text?: string | null
          event_date?: string | null
          id?: string
          start_time?: string | null
          time_text?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "calendar_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      note_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notebook_pages: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          end_time: string | null
          end_time_text: string | null
          event_date: string | null
          hide_date: boolean
          id: string
          note_type: string
          notebook_id: string
          order_index: number
          show_in_calendar: boolean
          start_time: string | null
          time_text: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          end_time?: string | null
          end_time_text?: string | null
          event_date?: string | null
          hide_date?: boolean
          id?: string
          note_type?: string
          notebook_id: string
          order_index?: number
          show_in_calendar?: boolean
          start_time?: string | null
          time_text?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          end_time?: string | null
          end_time_text?: string | null
          event_date?: string | null
          hide_date?: boolean
          id?: string
          note_type?: string
          notebook_id?: string
          order_index?: number
          show_in_calendar?: boolean
          start_time?: string | null
          time_text?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_pages_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebooks: {
        Row: {
          color: string | null
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          end_time: string | null
          end_time_text: string | null
          event_date: string | null
          folder_id: string | null
          folder_name: string | null
          hide_date: boolean
          hide_from_all_notes: boolean
          id: string
          is_sticky: boolean
          pinned: boolean
          show_in_calendar: boolean
          start_time: string | null
          tags: string[]
          time_text: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          end_time?: string | null
          end_time_text?: string | null
          event_date?: string | null
          folder_id?: string | null
          folder_name?: string | null
          hide_date?: boolean
          hide_from_all_notes?: boolean
          id?: string
          is_sticky?: boolean
          pinned?: boolean
          show_in_calendar?: boolean
          start_time?: string | null
          tags?: string[]
          time_text?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          end_time?: string | null
          end_time_text?: string | null
          event_date?: string | null
          folder_id?: string | null
          folder_name?: string | null
          hide_date?: boolean
          hide_from_all_notes?: boolean
          id?: string
          is_sticky?: boolean
          pinned?: boolean
          show_in_calendar?: boolean
          start_time?: string | null
          tags?: string[]
          time_text?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          order_index: number
          task_id: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          order_index?: number
          task_id: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          order_index?: number
          task_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_lists: {
        Row: {
          color: string | null
          created_at: string
          id: string
          order_index: number
          pinned: boolean
          sort_mode: string
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          order_index?: number
          pinned?: boolean
          sort_mode?: string
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          order_index?: number
          pinned?: boolean
          sort_mode?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      task_sections: {
        Row: {
          collapsed: boolean
          created_at: string
          id: string
          list_id: string | null
          name: string
          order_index: number
          user_id: string
        }
        Insert: {
          collapsed?: boolean
          created_at?: string
          id?: string
          list_id?: string | null
          name: string
          order_index?: number
          user_id: string
        }
        Update: {
          collapsed?: boolean
          created_at?: string
          id?: string
          list_id?: string | null
          name?: string
          order_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_sections_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "task_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category_name: string | null
          color: string | null
          completed: boolean
          created_at: string
          due_date: string | null
          end_time: string | null
          end_time_text: string | null
          hidden: boolean
          id: string
          list_id: string | null
          note: string | null
          order_index: number
          parent_task_id: string | null
          priority: string | null
          section_id: string | null
          start_time: string | null
          time_text: string | null
          title: string
          user_id: string
        }
        Insert: {
          category_name?: string | null
          color?: string | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          end_time?: string | null
          end_time_text?: string | null
          hidden?: boolean
          id?: string
          list_id?: string | null
          note?: string | null
          order_index?: number
          parent_task_id?: string | null
          priority?: string | null
          section_id?: string | null
          start_time?: string | null
          time_text?: string | null
          title: string
          user_id: string
        }
        Update: {
          category_name?: string | null
          color?: string | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          end_time?: string | null
          end_time_text?: string | null
          hidden?: boolean
          id?: string
          list_id?: string | null
          note?: string | null
          order_index?: number
          parent_task_id?: string | null
          priority?: string | null
          section_id?: string | null
          start_time?: string | null
          time_text?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "task_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          subscription_status: string
          trial_start_date: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          subscription_status?: string
          trial_start_date?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          subscription_status?: string
          trial_start_date?: string
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
    Enums: {},
  },
} as const
