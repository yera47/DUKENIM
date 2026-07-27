/** Форматирует цену в тенге: `35 000 ₸` (неразрывный пробел, без копеек). */
export function formatPrice(amount: number): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${formatted}\u00A0₸`;
}
