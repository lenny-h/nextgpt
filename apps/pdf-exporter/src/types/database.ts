export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bucket_maintainer_invitations: {
        Row: {
          bucket_id: string;
          bucket_name: string;
          created_at: string;
          origin: string;
          target: string;
        };
        Insert: {
          bucket_id: string;
          bucket_name: string;
          created_at?: string;
          origin: string;
          target: string;
        };
        Update: {
          bucket_id?: string;
          bucket_name?: string;
          created_at?: string;
          origin?: string;
          target?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bucket_maintainer_invitations_bucket_id_bucket_id_fk";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      bucket_maintainers: {
        Row: {
          bucket_id: string;
          user_id: string;
        };
        Insert: {
          bucket_id: string;
          user_id: string;
        };
        Update: {
          bucket_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bucket_maintainers_bucket_id_buckets_id_fk";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      bucket_users: {
        Row: {
          bucket_id: string;
          user_id: string;
        };
        Insert: {
          bucket_id: string;
          user_id: string;
        };
        Update: {
          bucket_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bucket_users_bucket_id_bucket_id_fk";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      buckets: {
        Row: {
          created_at: string;
          id: string;
          max_size: number;
          name: string;
          owner: string;
          size: number;
          subscription_id: string;
          type: Database["public"]["Enums"]["bucket_type"];
          users_count: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          max_size: number;
          name: string;
          owner: string;
          size?: number;
          subscription_id?: string;
          type: Database["public"]["Enums"]["bucket_type"];
          users_count?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          max_size?: number;
          name?: string;
          owner?: string;
          size?: number;
          subscription_id?: string;
          type?: Database["public"]["Enums"]["bucket_type"];
          users_count?: number;
        };
        Relationships: [];
      };
      chats: {
        Row: {
          created_at: string;
          id: string;
          is_favourite: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_favourite?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_favourite?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      course_keys: {
        Row: {
          course_id: string;
          key: string;
        };
        Insert: {
          course_id: string;
          key: string;
        };
        Update: {
          course_id?: string;
          key?: string;
        };
        Relationships: [];
      };
      course_maintainer_invitations: {
        Row: {
          course_id: string;
          course_name: string;
          created_at: string;
          origin: string;
          target: string;
        };
        Insert: {
          course_id: string;
          course_name: string;
          created_at?: string;
          origin: string;
          target: string;
        };
        Update: {
          course_id?: string;
          course_name?: string;
          created_at?: string;
          origin?: string;
          target?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_maintainer_invitations_course_id_course_id_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      course_maintainers: {
        Row: {
          course_id: string;
          user_id: string;
        };
        Insert: {
          course_id: string;
          user_id: string;
        };
        Update: {
          course_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_maintainers_course_id_course_id_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      course_users: {
        Row: {
          course_id: string;
          user_id: string;
        };
        Insert: {
          course_id: string;
          user_id: string;
        };
        Update: {
          course_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_users_course_id_course_id_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          bucket_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          private: boolean;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          private?: boolean;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          private?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "courses_bucket_id_bucket_id_fk";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["document_kind"];
          title: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["document_kind"];
          title: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["document_kind"];
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          content: string;
          created_at: string;
          subject: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          subject: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          subject?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      files: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          name: string;
          size: number;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          name: string;
          size: number;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          size?: number;
        };
        Relationships: [
          {
            foreignKeyName: "files_course_id_course_id_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          chat_id: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          parts: Json;
          role: Database["public"]["Enums"]["role"];
        };
        Insert: {
          chat_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          parts: Json;
          role: Database["public"]["Enums"]["role"];
        };
        Update: {
          chat_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          parts?: Json;
          role?: Database["public"]["Enums"]["role"];
        };
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_chat_id_fk";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      models: {
        Row: {
          bucket_id: string;
          created_at: string;
          deployment_id: string | null;
          description: string | null;
          enc_api_key: string;
          id: string;
          name: string;
          resource_name: string | null;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          deployment_id?: string | null;
          description?: string | null;
          enc_api_key: string;
          id?: string;
          name: string;
          resource_name?: string | null;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          deployment_id?: string | null;
          description?: string | null;
          enc_api_key?: string;
          id?: string;
          name?: string;
          resource_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "models_bucket_id_bucket_id_fk";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          chapter: number | null;
          content: string;
          course_id: string;
          course_name: string;
          embedding: string;
          file_id: string;
          file_name: string;
          fts: unknown | null;
          id: string;
          page_index: number;
          page_number: number | null;
          sub_chapter: number | null;
        };
        Insert: {
          chapter?: number | null;
          content: string;
          course_id: string;
          course_name: string;
          embedding: string;
          file_id: string;
          file_name: string;
          fts?: unknown | null;
          id: string;
          page_index: number;
          page_number?: number | null;
          sub_chapter?: number | null;
        };
        Update: {
          chapter?: number | null;
          content?: string;
          course_id?: string;
          course_name?: string;
          embedding?: string;
          file_id?: string;
          file_name?: string;
          fts?: unknown | null;
          id?: string;
          page_index?: number;
          page_number?: number | null;
          sub_chapter?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pages_course_id_course_id_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pages_file_id_file_id_fk";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          public: boolean;
          username: string;
        };
        Insert: {
          id: string;
          name: string;
          public?: boolean;
          username: string;
        };
        Update: {
          id?: string;
          name?: string;
          public?: boolean;
          username?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          content: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          content: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          content?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          course_id: string;
          created_at: string;
          file_size: number;
          id: string;
          name: string;
          pub_date: string | null;
          status: Database["public"]["Enums"]["task_status"];
        };
        Insert: {
          course_id: string;
          created_at?: string;
          file_size: number;
          id?: string;
          name: string;
          pub_date?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
        };
        Update: {
          course_id?: string;
          created_at?: string;
          file_size?: number;
          id?: string;
          name?: string;
          pub_date?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
        };
        Relationships: [
          {
            foreignKeyName: "tasks_course_id_course_id_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      user_invitations: {
        Row: {
          bucket_id: string;
          bucket_name: string;
          created_at: string;
          origin: string;
          target: string;
        };
        Insert: {
          bucket_id: string;
          bucket_name: string;
          created_at?: string;
          origin: string;
          target: string;
        };
        Update: {
          bucket_id?: string;
          bucket_name?: string;
          created_at?: string;
          origin?: string;
          target?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_invitations_bucket_id_bucket_id_fk";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: {
          p_invitation_type: string;
          p_origin_user_id: string;
          p_resource_id: string;
          p_target_user_id: string;
        };
        Returns: undefined;
      };
      add_task_and_update_bucket: {
        Args: {
          p_course_id: string;
          p_file_size: number;
          p_id: string;
          p_name: string;
          p_pub_date?: string;
        };
        Returns: undefined;
      };
      create_bucket: {
        Args: {
          p_max_size: number;
          p_name: string;
          p_owner: string;
          p_type: Database["public"]["Enums"]["bucket_type"];
        };
        Returns: string;
      };
      create_course: {
        Args: {
          p_bucket_id: string;
          p_description: string;
          p_encrypted_key?: string;
          p_name: string;
          p_user_id: string;
        };
        Returns: string;
      };
      create_profile: {
        Args: { p_name: string; p_public?: boolean; p_username: string };
        Returns: undefined;
      };
      delete_chat: {
        Args: { p_chat_id: string };
        Returns: undefined;
      };
      delete_correction_prompt: {
        Args: { p_id: string };
        Returns: undefined;
      };
      delete_document: {
        Args: { p_id: string };
        Returns: undefined;
      };
      delete_file_and_update_bucket_size: {
        Args: { p_bucket_id: string; p_file_id: string };
        Returns: undefined;
      };
      delete_invitation: {
        Args: {
          p_invitation_type: string;
          p_origin: string;
          p_resource_id: string;
          p_target: string;
        };
        Returns: undefined;
      };
      get_bucket_courses: {
        Args: {
          items_per_page?: number;
          p_bucket_id: string;
          page_number?: number;
        };
        Returns: {
          id: string;
          name: string;
          private: boolean;
        }[];
      };
      get_bucket_maintainers: {
        Args: { p_bucket_id: string };
        Returns: {
          id: string;
          username: string;
        }[];
      };
      get_bucket_models: {
        Args: Record<PropertyKey, never>;
        Returns: {
          bucket_id: string;
          bucket_name: string;
          created_at: string;
          id: string;
          name: string;
        }[];
      };
      get_bucket_users: {
        Args: { p_bucket_id: string };
        Returns: {
          id: string;
          username: string;
        }[];
      };
      get_chat: {
        Args: { p_chat_id: string };
        Returns: {
          created_at: string;
          id: string;
          is_favourite: boolean;
          title: string;
          user_id: string;
        }[];
      };
      get_chat_title: {
        Args: { p_chat_id: string };
        Returns: {
          title: string;
        }[];
      };
      get_course_files: {
        Args: {
          items_per_page?: number;
          p_course_id: string;
          page_number?: number;
        };
        Returns: {
          course_id: string;
          created_at: string;
          id: string;
          name: string;
          size: number;
        }[];
      };
      get_course_maintainers: {
        Args: { p_course_id: string };
        Returns: {
          id: string;
          username: string;
        }[];
      };
      get_course_tasks: {
        Args: {
          items_per_page?: number;
          p_course_id: string;
          page_number?: number;
        };
        Returns: {
          course_id: string;
          created_at: string;
          id: string;
          name: string;
          pub_date: string;
          status: Database["public"]["Enums"]["task_status"];
        }[];
      };
      get_courses_files: {
        Args: {
          items_per_page?: number;
          p_course_ids: string[];
          page_number?: number;
        };
        Returns: {
          course_id: string;
          created_at: string;
          id: string;
          name: string;
          size: number;
        }[];
      };
      get_favourite_user_chats: {
        Args: { items_per_page?: number; page_number?: number };
        Returns: {
          created_at: string;
          id: string;
          is_favourite: boolean;
          title: string;
          user_id: string;
        }[];
      };
      get_incoming_invitations: {
        Args: {
          invitation_type: string;
          items_per_page?: number;
          page_number?: number;
        };
        Returns: {
          created_at: string;
          origin: string;
          origin_username: string;
          resource_id: string;
          resource_name: string;
          target: string;
        }[];
      };
      get_is_favourite: {
        Args: { p_chat_id: string };
        Returns: {
          is_favourite: boolean;
        }[];
      };
      get_maintained_buckets: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          id: string;
          max_size: number;
          name: string;
          owner: string;
          size: number;
          subscription_id: string;
          type: Database["public"]["Enums"]["bucket_type"];
          users_count: number;
        }[];
      };
      get_maintained_courses: {
        Args: { items_per_page?: number; page_number?: number };
        Returns: {
          bucket_id: string;
          bucket_name: string;
          created_at: string;
          description: string;
          id: string;
          name: string;
          private: boolean;
        }[];
      };
      get_messages: {
        Args: { p_chat_id: string };
        Returns: {
          id: string;
          metadata: Json;
          parts: Json;
          role: Database["public"]["Enums"]["role"];
        }[];
      };
      get_outgoing_invitations: {
        Args: {
          invitation_type: string;
          items_per_page?: number;
          page_number?: number;
        };
        Returns: {
          created_at: string;
          origin: string;
          resource_id: string;
          resource_name: string;
          target: string;
          target_username: string;
        }[];
      };
      get_random_chapter_pages: {
        Args: {
          p_file_chapters: number[];
          p_file_id: string;
          retrieve_content?: boolean;
        };
        Returns: {
          content: string;
          course_id: string;
          course_name: string;
          file_id: string;
          file_name: string;
          id: string;
          page_index: number;
        }[];
      };
      get_random_pages: {
        Args: { p_file_ids: string[]; retrieve_content?: boolean };
        Returns: {
          content: string;
          course_id: string;
          course_name: string;
          file_id: string;
          file_name: string;
          id: string;
          page_index: number;
        }[];
      };
      get_user_buckets: {
        Args: Record<PropertyKey, never>;
        Returns: {
          bucket_id: string;
          name: string;
          type: Database["public"]["Enums"]["bucket_type"];
        }[];
      };
      get_user_chats: {
        Args: { items_per_page?: number; page_number?: number };
        Returns: {
          created_at: string;
          id: string;
          is_favourite: boolean;
          title: string;
          user_id: string;
        }[];
      };
      get_user_document: {
        Args: { p_id: string };
        Returns: {
          content: string;
        }[];
      };
      get_user_documents: {
        Args: { items_per_page?: number; page_number?: number };
        Returns: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["document_kind"];
          title: string;
        }[];
      };
      get_user_models: {
        Args: { p_bucket_id: string };
        Returns: {
          description: string;
          id: string;
          name: string;
        }[];
      };
      get_user_profile: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          name: string;
          public: boolean;
          username: string;
        }[];
      };
      get_user_prompts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          content: string;
          id: string;
          name: string;
        }[];
      };
      ilike_bucket_courses: {
        Args: { p_bucket_id: string; prefix: string };
        Returns: {
          id: string;
          name: string;
          private: boolean;
        }[];
      };
      ilike_bucket_users: {
        Args: { p_bucket_id: string; prefix: string };
        Returns: {
          id: string;
          username: string;
        }[];
      };
      ilike_course_files: {
        Args: { p_course_id: string; prefix: string };
        Returns: {
          course_id: string;
          created_at: string;
          id: string;
          name: string;
          size: number;
        }[];
      };
      ilike_courses_files: {
        Args: { p_course_ids: string[]; prefix: string };
        Returns: {
          course_id: string;
          created_at: string;
          id: string;
          name: string;
          size: number;
        }[];
      };
      ilike_public_profiles: {
        Args: { prefix: string };
        Returns: {
          id: string;
          username: string;
        }[];
      };
      ilike_user_chats: {
        Args: { prefix: string };
        Returns: {
          created_at: string;
          id: string;
          is_favourite: boolean;
          title: string;
          user_id: string;
        }[];
      };
      ilike_user_documents: {
        Args: { prefix: string };
        Returns: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["document_kind"];
          title: string;
        }[];
      };
      increase_bucket_size: {
        Args: { p_bucket_id: string; p_file_size: number };
        Returns: undefined;
      };
      insert_feedback: {
        Args: { p_content: string; p_subject: string };
        Returns: undefined;
      };
      match_documents: {
        Args: {
          course_ids?: string[];
          file_ids?: string[];
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
          retrieve_content?: boolean;
        };
        Returns: {
          content: string;
          course_id: string;
          course_name: string;
          file_id: string;
          file_name: string;
          id: string;
          page_index: number;
          similarity: number;
        }[];
      };
      remove_bucket_users: {
        Args: { p_bucket_id: string; p_user_ids: string[] };
        Returns: number;
      };
      set_is_favourite: {
        Args: { p_chat_id: string; p_is_favourite: boolean };
        Returns: undefined;
      };
      update_chat_title: {
        Args: { p_chat_id: string; p_title: string };
        Returns: undefined;
      };
      update_correction_prompt: {
        Args: { p_content: string; p_id: string };
        Returns: undefined;
      };
      update_document_title: {
        Args: { p_id: string; p_title: string };
        Returns: undefined;
      };
      update_profile: {
        Args: { p_name: string; p_public: boolean; p_username: string };
        Returns: undefined;
      };
      update_status_to_failed: {
        Args: { p_bucket_id: string; p_task_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      bucket_type: "small" | "medium" | "large" | "org";
      document_kind: "code" | "text";
      role: "user" | "assistant" | "system";
      task_status: "scheduled" | "processing" | "failed" | "finished";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bucket_type: ["small", "medium", "large", "org"],
      document_kind: ["code", "text"],
      role: ["user", "assistant", "system"],
      task_status: ["scheduled", "processing", "failed", "finished"],
    },
  },
} as const;
