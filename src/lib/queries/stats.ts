import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export type ChannelStats = {
  ordersCount: number;
  revenue: number;
  topProducts: Array<{ title: string; qty: number; revenue: number }>;
};

export type TenantStats = {
  todayOnline: ChannelStats;
  todayOffline: ChannelStats;
  online: ChannelStats;
  offline: ChannelStats;
  lowStock: Array<{
    title: string;
    size: string | null;
    stock_qty: number;
  }>;
};

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function channelStats(
  tenantId: string,
  source: Enums<"order_source">,
  since?: string,
): Promise<ChannelStats> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, total, order_items(title_snapshot, qty, price_snapshot)")
    .eq("tenant_id", tenantId)
    .eq("source", source)
    .neq("status", "cancelled");

  if (since) query = query.gte("created_at", since);

  const { data } = await query;
  const rows = data ?? [];
  const topMap = new Map<string, { qty: number; revenue: number }>();

  let revenue = 0;
  for (const order of rows) {
    revenue += order.total;
    const items = (order.order_items ?? []) as Array<{
      title_snapshot: string;
      qty: number;
      price_snapshot: number;
    }>;
    for (const item of items) {
      const prev = topMap.get(item.title_snapshot) ?? { qty: 0, revenue: 0 };
      prev.qty += item.qty;
      prev.revenue += item.qty * item.price_snapshot;
      topMap.set(item.title_snapshot, prev);
    }
  }

  const topProducts = [...topMap.entries()]
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return { ordersCount: rows.length, revenue, topProducts };
}

export async function getTenantStats(tenantId: string): Promise<TenantStats> {
  const supabase = await createClient();
  const today = startOfTodayIso();

  const [todayOnline, todayOffline, online, offline, stock] = await Promise.all([
    channelStats(tenantId, "online", today),
    channelStats(tenantId, "offline", today),
    channelStats(tenantId, "online"),
    channelStats(tenantId, "offline"),
    supabase
      .from("product_variants")
      .select("size, stock_qty, products(title)")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .lte("stock_qty", 3)
      .order("stock_qty", { ascending: true })
      .limit(20),
  ]);

  const lowStock = (stock.data ?? []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      title: (product as { title?: string } | null)?.title ?? "Товар",
      size: row.size,
      stock_qty: row.stock_qty,
    };
  });

  return {
    todayOnline,
    todayOffline,
    online,
    offline,
    lowStock,
  };
}

export async function getPlatformStats() {
  const supabase = await createClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, status");
  const { data: orders } = await supabase
    .from("orders")
    .select("tenant_id, total, source, status, created_at")
    .neq("status", "cancelled");

  const revenue = (orders ?? []).reduce((s, o) => s + o.total, 0);
  const byTenant = new Map<string, number>();
  for (const o of orders ?? []) {
    byTenant.set(o.tenant_id, (byTenant.get(o.tenant_id) ?? 0) + o.total);
  }

  return {
    tenantsCount: tenants?.length ?? 0,
    activeTenants: (tenants ?? []).filter((t) => t.status === "active").length,
    ordersCount: orders?.length ?? 0,
    revenue,
    tenants: (tenants ?? []).map((t) => ({
      ...t,
      revenue: byTenant.get(t.id) ?? 0,
    })),
  };
}
