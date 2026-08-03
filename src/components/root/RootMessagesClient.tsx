"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  sendAdminMessageAction,
  updateRequestStatusAction,
} from "@/lib/actions/settings";
import type { Tables } from "@/types/database";

type Props = {
  tenants: Array<{ id: string; name: string }>;
  selectedTenantId: string;
  messages: Tables<"messages">[];
  requests: Array<{
    id: string;
    text: string;
    status: "new" | "in_progress" | "done";
    created_at: string;
    tenant_id: string;
    tenants: { name: string; slug: string } | null;
  }>;
};

export function RootMessagesClient({
  tenants,
  selectedTenantId,
  messages,
  requests,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4">
        <label className="block text-sm">
          Магазин
          <select
            className="mt-1 h-9 w-full rounded-lg border px-2 text-sm"
            value={selectedTenantId}
            onChange={(e) =>
              router.push(`/root/messages?tenant=${e.target.value}`)
            }
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <ul className="max-h-80 space-y-2 overflow-y-auto rounded-xl border bg-white p-3 text-sm">
          {messages.map((m) => (
            <li key={m.id}>
              <span className="text-xs text-neutral-500">
                {m.from_role === "superadmin" ? "Вы" : "Владелец"} ·{" "}
                {new Date(m.created_at).toLocaleString("ru-RU")}
              </span>
              <p>{m.text}</p>
            </li>
          ))}
          {messages.length === 0 ? (
            <li className="text-neutral-500">Пока пусто</li>
          ) : null}
        </ul>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Ответ владельцу…"
        />
        <Button
          type="button"
          disabled={pending || !selectedTenantId}
          style={{ backgroundColor: "#0E5C4A", color: "white" }}
          onClick={() => {
            start(async () => {
              await sendAdminMessageAction(selectedTenantId, text);
              setText("");
              router.refresh();
            });
          }}
        >
          Отправить
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Заявки на изменение сайта</h2>
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border bg-white p-3 text-sm">
              <p className="font-medium">
                {(r.tenants as { name?: string } | null)?.name ?? "Магазин"}
              </p>
              <p className="mt-1">{r.text}</p>
              <div className="mt-2 flex gap-2">
                {(["new", "in_progress", "done"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    disabled={r.status === status}
                    onClick={() => {
                      start(async () => {
                        await updateRequestStatusAction(r.id, status);
                        router.refresh();
                      });
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
