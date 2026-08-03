"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { upgradePlanAction } from "@/lib/actions/settings";
import { formatPrice } from "@/lib/format-price";
import {
  PLAN_FEATURES,
  PLAN_LABEL,
  type FeatureKey,
  type PlanId,
} from "@/lib/plans";

const FEATURE_LABELS: Record<FeatureKey, string> = {
  onlineCheckout: "Онлайн-заказ с витрины",
  whatsappOrders: "Заказы в WhatsApp",
  customDomain: "Свой домен",
  orderStats: "Статистика заказов",
  onlinePayments: "Онлайн-оплата",
  warehouse: "Склад и остатки",
  offlineSell: "Продажа в зале",
  fullAnalytics: "Полная аналитика",
  customersDb: "База клиентов",
  priorityRequests: "Приоритетные заявки",
};

const PLAN_PRICES: Record<PlanId, number> = {
  basic: 9900,
  standard: 19900,
  pro: 39900,
};

const PLANS: PlanId[] = ["basic", "standard", "pro"];

type PlanPanelProps = {
  currentPlan: PlanId;
};

export function PlanPanel({ currentPlan }: PlanPanelProps) {
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onUpgrade(plan: PlanId) {
    setError(null);
    setMessage(null);
    setPendingPlan(plan);
    startTransition(async () => {
      const result = await upgradePlanAction(plan);
      setPendingPlan(null);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("success" in result && result.success) {
        setMessage(result.success);
      }
    });
  }

  const currentFeatures = PLAN_FEATURES[currentPlan];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Тариф</h2>
        <p className="text-muted-foreground text-sm">
          Сейчас:{" "}
          <span className="font-medium text-[#0E5C4A]">
            {PLAN_LABEL[currentPlan]}
          </span>
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <ul className="divide-y rounded-xl border bg-white">
        {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((key) => (
          <li
            key={key}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span>{FEATURE_LABELS[key]}</span>
            <span
              className={
                currentFeatures[key]
                  ? "font-medium text-[#0E5C4A]"
                  : "text-muted-foreground"
              }
            >
              {currentFeatures[key] ? "Есть" : "Нет"}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan === currentPlan;
          const isBusy = pending && pendingPlan === plan;
          return (
            <div
              key={plan}
              className="space-y-3 rounded-xl border bg-white p-4"
            >
              <div>
                <p className="font-semibold">{PLAN_LABEL[plan]}</p>
                <p className="text-muted-foreground text-sm">
                  {formatPrice(PLAN_PRICES[plan])} / мес
                </p>
              </div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                {(Object.keys(FEATURE_LABELS) as FeatureKey[])
                  .filter((key) => PLAN_FEATURES[plan][key])
                  .slice(0, 5)
                  .map((key) => (
                    <li key={key}>• {FEATURE_LABELS[key]}</li>
                  ))}
              </ul>
              <Button
                type="button"
                disabled={pending || isCurrent}
                onClick={() => onUpgrade(plan)}
                className={
                  isCurrent
                    ? "w-full"
                    : "w-full bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
                }
                variant={isCurrent ? "outline" : "default"}
              >
                {isCurrent
                  ? "Текущий"
                  : isBusy
                    ? "Оплата…"
                    : `Перейти на ${PLAN_LABEL[plan]}`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
