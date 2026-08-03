/**
 * Изолированный платёжный модуль.
 * СЕЙЧАС: заглушка (мок). Когда подключим Kaspi — заменить ТОЛЬКО тело processPayment().
 * Остальной код (активация тарифа / статус заказа) менять не нужно.
 */

export type PaymentInput = {
  amount: number;
  currency?: "KZT";
  description: string;
  metadata?: Record<string, string>;
};

export type PaymentResult =
  | {
      ok: true;
      provider: "mock";
      paymentId: string;
      paidAt: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function processPayment(
  input: PaymentInput,
): Promise<PaymentResult> {
  // === ЗАМЕНИТЬ НА РЕАЛЬНЫЙ ПРОВАЙДЕР (Kaspi) ===
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: "Некорректная сумма" };
  }

  await new Promise((resolve) => setTimeout(resolve, 900));

  return {
    ok: true,
    provider: "mock",
    paymentId: `mock_${crypto.randomUUID()}`,
    paidAt: new Date().toISOString(),
  };
  // === КОНЕЦ ЗАГЛУШКИ ===
}
