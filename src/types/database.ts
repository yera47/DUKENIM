export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          custom_domain: string | null;
          name: string;
          tagline: string | null;
          logo_url: string | null;
          accent_color: string;
          city: string;
          phone: string;
          whatsapp: string | null;
          instagram: string | null;
          plan: Database["public"]["Enums"]["tenant_plan"];
          status: Database["public"]["Enums"]["tenant_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          custom_domain?: string | null;
          name: string;
          tagline?: string | null;
          logo_url?: string | null;
          accent_color?: string;
          city?: string;
          phone: string;
          whatsapp?: string | null;
          instagram?: string | null;
          plan?: Database["public"]["Enums"]["tenant_plan"];
          status?: Database["public"]["Enums"]["tenant_status"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["staff_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["staff_role"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenant_users"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          role: Database["public"]["Enums"]["profile_role"];
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: Database["public"]["Enums"]["profile_role"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      tenant_settings: {
        Row: {
          tenant_id: string;
          delivery_enabled: boolean;
          pickup_enabled: boolean;
          payment_online: boolean;
          payment_provider: string;
          merchant_id: string | null;
          merchant_key: string | null;
          min_order: number;
        };
        Insert: {
          tenant_id: string;
          delivery_enabled?: boolean;
          pickup_enabled?: boolean;
          payment_online?: boolean;
          payment_provider?: string;
          merchant_id?: string | null;
          merchant_key?: string | null;
          min_order?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["tenant_settings"]["Insert"]
        >;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          plan: Database["public"]["Enums"]["tenant_plan"];
          status: Database["public"]["Enums"]["subscription_status"];
          started_at: string;
          current_period_end: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plan: Database["public"]["Enums"]["tenant_plan"];
          status?: Database["public"]["Enums"]["subscription_status"];
          started_at?: string;
          current_period_end?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      change_requests: {
        Row: {
          id: string;
          tenant_id: string;
          text: string;
          status: Database["public"]["Enums"]["change_request_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          text: string;
          status?: Database["public"]["Enums"]["change_request_status"];
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["change_requests"]["Insert"]
        >;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          tenant_id: string;
          from_role: Database["public"]["Enums"]["message_from_role"];
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          from_role: Database["public"]["Enums"]["message_from_role"];
          text: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          slug: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          price: number;
          old_price: number | null;
          images: string[];
          is_active: boolean;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          price: number;
          old_price?: number | null;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          tenant_id: string;
          size: string | null;
          color: string | null;
          sku: string | null;
          stock_qty: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          product_id: string;
          tenant_id: string;
          size?: string | null;
          color?: string | null;
          sku?: string | null;
          stock_qty?: number;
          is_active?: boolean;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_variants"]["Insert"]
        >;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          tenant_id: string;
          phone: string;
          name: string | null;
          first_order: string | null;
          last_order: string | null;
          orders_count: number;
          total_spent: number;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          phone: string;
          name?: string | null;
          first_order?: string | null;
          last_order?: string | null;
          orders_count?: number;
          total_spent?: number;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      delivery_zones: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          cost: number;
          free_from: number | null;
          eta_text: string | null;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          cost?: number;
          free_from?: number | null;
          eta_text?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["delivery_zones"]["Insert"]
        >;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string | null;
          order_number: number | null;
          source: Database["public"]["Enums"]["order_source"];
          status: Database["public"]["Enums"]["order_status"];
          delivery_method: Database["public"]["Enums"]["delivery_method"] | null;
          delivery_address: string | null;
          delivery_cost: number;
          subtotal: number;
          total: number;
          payment_method: Database["public"]["Enums"]["payment_method"] | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          staff_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id?: string | null;
          order_number?: number | null;
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          delivery_method?:
            | Database["public"]["Enums"]["delivery_method"]
            | null;
          delivery_address?: string | null;
          delivery_cost?: number;
          subtotal?: number;
          total?: number;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          staff_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          tenant_id: string;
          variant_id: string | null;
          title_snapshot: string;
          price_snapshot: number;
          qty: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          tenant_id: string;
          variant_id?: string | null;
          title_snapshot: string;
          price_snapshot: number;
          qty: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          tenant_id: string;
          variant_id: string;
          delta: number;
          reason: Database["public"]["Enums"]["stock_reason"];
          order_id: string | null;
          staff_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          variant_id: string;
          delta: number;
          reason: Database["public"]["Enums"]["stock_reason"];
          order_id?: string | null;
          staff_id?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["stock_movements"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_tenant_ids: { Args: Record<string, never>; Returns: string[] };
      is_superadmin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      tenant_status: "active" | "paused" | "trial";
      tenant_plan: "basic" | "standard" | "pro";
      staff_role: "owner" | "admin" | "staff";
      profile_role: "customer" | "owner" | "superadmin";
      order_source: "online" | "offline";
      order_status:
        | "new"
        | "confirmed"
        | "assembled"
        | "delivering"
        | "done"
        | "cancelled";
      delivery_method: "pickup" | "courier";
      payment_method: "cash" | "card" | "kaspi" | "transfer" | "online";
      payment_status: "pending" | "paid" | "refunded";
      stock_reason: "sale" | "return" | "restock" | "correction" | "writeoff";
      subscription_status: "active" | "canceled";
      change_request_status: "new" | "in_progress" | "done";
      message_from_role: "owner" | "superadmin";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
