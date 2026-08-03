import type { Enums } from "@/types/database";

export type PlanId = Enums<"tenant_plan">;

export const PLAN_LABEL: Record<PlanId, string> = {
  basic: "Basic",
  standard: "Standard",
  pro: "Pro",
};

export const PLAN_FEATURES = {
  basic: {
    onlineCheckout: true,
    whatsappOrders: true,
    customDomain: true,
    orderStats: true,
    onlinePayments: false,
    warehouse: false,
    offlineSell: false,
    fullAnalytics: false,
    customersDb: false,
    priorityRequests: false,
  },
  standard: {
    onlineCheckout: true,
    whatsappOrders: true,
    customDomain: true,
    orderStats: true,
    onlinePayments: true,
    warehouse: true,
    offlineSell: true,
    fullAnalytics: true,
    customersDb: true,
    priorityRequests: false,
  },
  pro: {
    onlineCheckout: true,
    whatsappOrders: true,
    customDomain: true,
    orderStats: true,
    onlinePayments: true,
    warehouse: true,
    offlineSell: true,
    fullAnalytics: true,
    customersDb: true,
    priorityRequests: true,
  },
} as const;

export type FeatureKey = keyof (typeof PLAN_FEATURES)["basic"];

export function planHas(plan: PlanId, feature: FeatureKey): boolean {
  return PLAN_FEATURES[plan][feature];
}

export function requiredPlanFor(feature: FeatureKey): PlanId {
  if (PLAN_FEATURES.basic[feature]) return "basic";
  if (PLAN_FEATURES.standard[feature]) return "standard";
  return "pro";
}
