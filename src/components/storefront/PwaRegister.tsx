"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister({ slug }: { slug: string }) {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const dismissed = sessionStorage.getItem(`pwa-dismiss-${slug}`);
    const userAgent = navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const mobileDevice = /android|iphone|ipad|ipod/.test(userAgent);

    setIsIos(iosDevice);
    if (dismissed || standalone || !mobileDevice) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      deferredRef.current = promptEvent;
      setDeferred(promptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const showTimer = window.setTimeout(() => {
      if (!sessionStorage.getItem(`pwa-dismiss-${slug}`)) {
        setVisible(true);
      }
    }, 800);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, [slug]);

  function dismiss() {
    sessionStorage.setItem(`pwa-dismiss-${slug}`, "1");
    setVisible(false);
    setShowIosHelp(false);
  }

  async function onAdd() {
    const promptEvent = deferredRef.current ?? deferred;
    if (promptEvent) {
      setBusy(true);
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setDeferred(null);
        deferredRef.current = null;
        dismiss();
      } finally {
        setBusy(false);
      }
      return;
    }

    setShowIosHelp(true);
  }

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--sf-line)] bg-[var(--sf-bg)] p-4 shadow-[var(--sf-shadow)]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <p className="min-w-0 flex-1 text-sm">
            Добавить витрину на экран телефона
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            Позже
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            style={{ backgroundColor: "var(--accent)", color: "white" }}
            onClick={onAdd}
          >
            {busy ? "…" : "Добавить"}
          </Button>
        </div>
      </div>

      {showIosHelp ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--sf-surface)] p-5 shadow-xl">
            <h2 className="text-base font-semibold">
              Добавить одной кнопкой из меню
            </h2>
            <p className="mt-2 text-sm text-[var(--sf-muted)]">
              {isIos
                ? "На iPhone сайт сам установить нельзя — Apple так устроил. Нужно 2 нажатия в Safari:"
                : "В этом браузере нет автоустановки. Откройте меню и нажмите «Установить» / «На главный экран»."}
            </p>
            {isIos ? (
              <ol className="mt-4 space-y-2 text-sm">
                <li>1. Нажмите кнопку «Поделиться» ↓ внизу Safari</li>
                <li>2. Выберите «На экран Домой»</li>
                <li>3. Нажмите «Добавить»</li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2 text-sm">
                <li>1. Меню ⋮ в правом верхнем углу</li>
                <li>2. «Установить приложение» или «Добавить на главный экран»</li>
              </ol>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowIosHelp(false)}
              >
                Понятно
              </Button>
              <Button
                type="button"
                className="flex-1"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
                onClick={dismiss}
              >
                Готово
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
