import Link from "next/link";
import type { ReactNode } from "react";

import {
  PLAN_LABEL,
  requiredPlanFor,
  type FeatureKey,
} from "@/lib/plans";

type FeatureGateProps = {
  allowed: boolean;
  feature: FeatureKey;
  children: ReactNode;
};

export function FeatureGate({ allowed, feature, children }: FeatureGateProps) {
  if (allowed) return <>{children}</>;

  const plan = requiredPlanFor(feature);

  return (
    <div className="rounded-xl border border-[#0E5C4A]/20 bg-white p-6 text-center">
      <p className="text-base font-medium">
        Доступно на тарифе {PLAN_LABEL[plan]}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        Обновите подписку, чтобы открыть этот раздел.
      </p>
      <Link
        href="/admin/plan"
        className="mt-4 inline-flex h-8 items-center rounded-lg bg-[#0E5C4A] px-3 text-sm font-medium text-white hover:bg-[#0E5C4A]/90"
      >
        Смотреть тарифы
      </Link>
    </div>
  );
}
