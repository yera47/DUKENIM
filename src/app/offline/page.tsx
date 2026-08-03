export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold">Нет сети</h1>
      <p className="text-sm text-neutral-600">
        Проверьте интернет и откройте витрину снова.
      </p>
    </main>
  );
}
