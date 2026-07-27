"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister({ slug }: { slug: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem(`pwa-dismiss-${slug}`);
      if (!dismissed) setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, [slug]);

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <p className="text-sm">Добавить витрину на экран телефона</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              sessionStorage.setItem(`pwa-dismiss-${slug}`, "1");
              setVisible(false);
            }}
          >
            Позже
          </Button>
          <Button
            type="button"
            size="sm"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
            onClick={async () => {
              await deferred.prompt();
              await deferred.userChoice;
              setVisible(false);
              setDeferred(null);
            }}
          >
            Добавить
          </Button>
        </div>
      </div>
    </div>
  );
}
