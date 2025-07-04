export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          full_name?: string;
          avatar_url?: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string;
          avatar_url?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string;
          avatar_url?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description?: string;
          cover_image_url?: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          cover_image_url?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          cover_image_url?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          title?: string;
          description?: string;
          image_url?: string;
          platform?: string;
          notes?: string;
          tags?: string[];
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title?: string;
          description?: string;
          image_url?: string;
          platform?: string;
          notes?: string;
          tags?: string[];
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          title?: string;
          description?: string;
          image_url?: string;
          platform?: string;
          notes?: string;
          tags?: string[];
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_links: {
        Row: {
          id: string;
          collection_id: string;
          link_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          link_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          link_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];
export type Link = Database['public']['Tables']['links']['Row'];
export type CollectionLink = Database['public']['Tables']['collection_links']['Row'];

export type InsertUser = Database['public']['Tables']['users']['Insert'];
export type InsertCollection = Database['public']['Tables']['collections']['Insert'];
export type InsertLink = Database['public']['Tables']['links']['Insert'];
export type InsertCollectionLink = Database['public']['Tables']['collection_links']['Insert'];

export type UpdateUser = Database['public']['Tables']['users']['Update'];
export type UpdateCollection = Database['public']['Tables']['collections']['Update'];
export type UpdateLink = Database['public']['Tables']['links']['Update'];
export type UpdateCollectionLink = Database['public']['Tables']['collection_links']['Update']; 