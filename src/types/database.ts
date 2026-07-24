/**
 * Типы схемы public из миграции 20260724100000_initial_schema.
 * После `supabase start` / линка к проекту перегенерируйте:
 *   npm run db:types
 */
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
          address: string | null;
          phone: string;
          whatsapp: string | null;
          instagram: string | null;
          working_hours: Json | null;
          status: Database["public"]["Enums"]["tenant_status"];
          plan: Database["public"]["Enums"]["tenant_plan"];
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
          address?: string | null;
          phone: string;
          whatsapp?: string | null;
          instagram?: string | null;
          working_hours?: Json | null;
          status?: Database["public"]["Enums"]["tenant_status"];
          plan?: Database["public"]["Enums"]["tenant_plan"];
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          custom_domain?: string | null;
          name?: string;
          tagline?: string | null;
          logo_url?: string | null;
          accent_color?: string;
          city?: string;
          address?: string | null;
          phone?: string;
          whatsapp?: string | null;
          instagram?: string | null;
          working_hours?: Json | null;
          status?: Database["public"]["Enums"]["tenant_status"];
          plan?: Database["public"]["Enums"]["tenant_plan"];
          created_at?: string;
        };
        Relationships: [];
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["user_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_settings: {
        Row: {
          tenant_id: string;
          delivery_enabled: boolean;
          pickup_enabled: boolean;
          yandex_enabled: boolean;
          delivery_note: string | null;
          payment_online: boolean;
          payment_provider: string;
          merchant_id: string | null;
          merchant_key: string | null;
          loyalty_enabled: boolean;
          loyalty_percent: number;
          loyalty_goal: number | null;
          min_order: number;
        };
        Insert: {
          tenant_id: string;
          delivery_enabled?: boolean;
          pickup_enabled?: boolean;
          yandex_enabled?: boolean;
          delivery_note?: string | null;
          payment_online?: boolean;
          payment_provider?: string;
          merchant_id?: string | null;
          merchant_key?: string | null;
          loyalty_enabled?: boolean;
          loyalty_percent?: number;
          loyalty_goal?: number | null;
          min_order?: number;
        };
        Update: {
          tenant_id?: string;
          delivery_enabled?: boolean;
          pickup_enabled?: boolean;
          yandex_enabled?: boolean;
          delivery_note?: string | null;
          payment_online?: boolean;
          payment_provider?: string;
          merchant_id?: string | null;
          merchant_key?: string | null;
          loyalty_enabled?: boolean;
          loyalty_percent?: number;
          loyalty_goal?: number | null;
          min_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
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
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
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
        Update: {
          id?: string;
          tenant_id?: string;
          category_id?: string | null;
          title?: string;
          description?: string | null;
          price?: number;
          old_price?: number | null;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
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
          price_delta: number;
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
          price_delta?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          product_id?: string;
          tenant_id?: string;
          size?: string | null;
          color?: string | null;
          sku?: string | null;
          stock_qty?: number;
          price_delta?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
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
          created_at: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          phone?: string;
          name?: string | null;
          first_order?: string | null;
          last_order?: string | null;
          orders_count?: number;
          total_spent?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string | null;
          order_number: number;
          source: Database["public"]["Enums"]["order_source"];
          status: Database["public"]["Enums"]["order_status"];
          delivery_method: Database["public"]["Enums"]["delivery_method"] | null;
          delivery_address: string | null;
          delivery_comment: string | null;
          delivery_cost: number;
          subtotal: number;
          bonus_used: number;
          bonus_earned: number;
          total: number;
          payment_method: Database["public"]["Enums"]["payment_method"] | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          staff_id: string | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id?: string | null;
          // Заполняется триггером set_order_number, если не передан
          order_number?: number;
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          delivery_method?: Database["public"]["Enums"]["delivery_method"] | null;
          delivery_address?: string | null;
          delivery_comment?: string | null;
          delivery_cost?: number;
          subtotal: number;
          bonus_used?: number;
          bonus_earned?: number;
          total: number;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          staff_id?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string | null;
          order_number?: number;
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          delivery_method?: Database["public"]["Enums"]["delivery_method"] | null;
          delivery_address?: string | null;
          delivery_comment?: string | null;
          delivery_cost?: number;
          subtotal?: number;
          bonus_used?: number;
          bonus_earned?: number;
          total?: number;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          staff_id?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          tenant_id: string;
          variant_id: string;
          title_snapshot: string;
          price_snapshot: number;
          qty: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          tenant_id: string;
          variant_id: string;
          title_snapshot: string;
          price_snapshot: number;
          qty: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          tenant_id?: string;
          variant_id?: string;
          title_snapshot?: string;
          price_snapshot?: number;
          qty?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
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
        Update: {
          id?: string;
          tenant_id?: string;
          variant_id?: string;
          delta?: number;
          reason?: Database["public"]["Enums"]["stock_reason"];
          order_id?: string | null;
          staff_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
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
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          cost?: number;
          free_from?: number | null;
          eta_text?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_zones_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      promotions: {
        Row: {
          id: string;
          tenant_id: string;
          title: string;
          subtitle: string | null;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          title: string;
          subtitle?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          title?: string;
          subtitle?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "promotions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      user_tenant_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
    };
    Enums: {
      tenant_status: "active" | "paused" | "trial";
      tenant_plan: "basic" | "loyalty" | "full";
      user_role: "owner" | "admin" | "staff";
      order_source: "online" | "offline";
      order_status:
        | "new"
        | "confirmed"
        | "assembled"
        | "delivering"
        | "done"
        | "cancelled";
      delivery_method: "pickup" | "courier" | "yandex";
      payment_method: "cash" | "card" | "kaspi" | "transfer";
      payment_status: "pending" | "paid" | "refunded";
      stock_reason: "sale" | "return" | "restock" | "correction" | "writeoff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
