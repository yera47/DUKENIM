import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export type ChannelStats = {
  ordersCount: number;
  revenue: number;
  topProducts: Array<{ title: string; qty: number; revenue: number }>;
};

export type TenantStats = {
  online: ChannelStats;
  offline: ChannelStats;
};

const EMPTY: ChannelStats = {
  ordersCount: 0,
  revenue: 0,
  topProducts: [],
};

function emptyStats(): TenantStats {
  return { online: { ...EMPTY, topProducts: [] }, offline: { ...EMPTY, topProducts: [] } };
}

export async function getTenantStats(tenantId: string): Promise<TenantStats> {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, source, total, status, order_items(title_snapshot, qty, price_snapshot)")
    .eq("tenant_id", tenantId)
    .neq("status", "cancelled");

  if (error || !orders) return emptyStats();

  const stats = emptyStats();

  type ItemRow = {
    title_snapshot: string;
    qty: number;
    price_snapshot: number;
  };

  for (const order of orders) {
    const source = order.source as Enums<"order_source">;
    const channel = source === "offline" ? stats.offline : stats.online;
    channel.ordersCount += 1;
    channel.revenue += order.total;

    const items = (order.order_items ?? []) as ItemRow[];
    for (const item of items) {
      const existing = channel.topProducts.find(
        (row) => row.title === item.title_snapshot,
      );
      const lineRevenue = item.price_snapshot * item.qty;
      if (existing) {
        existing.qty += item.qty;
        existing.revenue += lineRevenue;
      } else {
        channel.topProducts.push({
          title: item.title_snapshot,
          qty: item.qty,
          revenue: lineRevenue,
        });
      }
    }
  }

  for (const channel of [stats.online, stats.offline]) {
    channel.topProducts.sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
    channel.topProducts = channel.topProducts.slice(0, 5);
  }

  return stats;
}
