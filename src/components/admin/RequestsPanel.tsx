"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createRequestAction,
  sendOwnerMessageAction,
  type SettingsState,
} from "@/lib/actions/settings";
import type { ChangeRequest, Message } from "@/lib/queries/comms";

const initialState: SettingsState = {};

const REQUEST_STATUS: Record<ChangeRequest["status"], string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Готово",
};

type RequestsPanelProps = {
  requests: ChangeRequest[];
  messages: Message[];
};

export function RequestsPanel({ requests, messages }: RequestsPanelProps) {
  const [requestState, requestAction, requestPending] = useActionState(
    createRequestAction,
    initialState,
  );
  const [messageState, messageAction, messagePending] = useActionState(
    sendOwnerMessageAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Заявки и сообщения</h2>
        <p className="text-muted-foreground text-sm">
          Напишите, что нужно изменить на витрине, или переписку с поддержкой
        </p>
      </div>

      <form
        action={requestAction}
        className="space-y-3 rounded-xl border bg-white p-4"
      >
        <Label htmlFor="request_text">Новая заявка</Label>
        <Textarea
          id="request_text"
          name="text"
          required
          rows={3}
          placeholder="Например: сменить логотип и цвет кнопок"
        />
        {requestState.error ? (
          <p className="text-sm text-destructive">{requestState.error}</p>
        ) : null}
        {requestState.success ? (
          <p className="text-sm text-emerald-700">{requestState.success}</p>
        ) : null}
        <Button
          type="submit"
          disabled={requestPending}
          className="bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
        >
          {requestPending ? "Отправляем…" : "Отправить заявку"}
        </Button>
      </form>

      <section className="space-y-3">
        <h3 className="font-medium">История заявок</h3>
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-sm">Заявок пока нет</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white">
            {requests.map((request) => (
              <li key={request.id} className="space-y-1 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[#0E5C4A]">
                    {REQUEST_STATUS[request.status]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(request.created_at).toLocaleString("ru-KZ")}
                  </span>
                </div>
                <p>{request.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Сообщения</h3>
        <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border bg-white p-4">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">Пока пусто</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.from_role === "owner"
                    ? "ml-8 rounded-lg bg-[#0E5C4A]/10 px-3 py-2 text-sm"
                    : "mr-8 rounded-lg bg-muted px-3 py-2 text-sm"
                }
              >
                <p className="text-muted-foreground mb-1 text-xs">
                  {message.from_role === "owner" ? "Вы" : "Поддержка"} ·{" "}
                  {new Date(message.created_at).toLocaleString("ru-KZ")}
                </p>
                <p>{message.text}</p>
              </div>
            ))
          )}
        </div>

        <form action={messageAction} className="space-y-3">
          <Label htmlFor="message_text">Написать поддержке</Label>
          <Textarea
            id="message_text"
            name="text"
            required
            rows={2}
            placeholder="Сообщение…"
          />
          {messageState.error ? (
            <p className="text-sm text-destructive">{messageState.error}</p>
          ) : null}
          {messageState.success ? (
            <p className="text-sm text-emerald-700">{messageState.success}</p>
          ) : null}
          <Button
            type="submit"
            disabled={messagePending}
            variant="outline"
          >
            {messagePending ? "Отправляем…" : "Отправить"}
          </Button>
        </form>
      </section>
    </div>
  );
}
