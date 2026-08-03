export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat("ru-KZ").format(Math.round(amount))} ₸`;
}
