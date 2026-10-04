import type { MaterialItem } from "@/lib/types";

/** Line total in integer cents; rounds to avoid float drift. */
export function lineTotalCents(item: MaterialItem): number {
  const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
  const unit = Number.isFinite(item.unitCostCents) && item.unitCostCents > 0 ? item.unitCostCents : 0;
  return Math.round(qty * unit);
}

/** Sum of all line totals in integer cents. */
export function materialsTotalCents(items: MaterialItem[]): number {
  return items.reduce((sum, item) => sum + lineTotalCents(item), 0);
}

/** Format integer cents as US dollars, e.g. 123456 -> "$1,234.56". */
export function formatCents(cents: number): string {
  const safe = Number.isFinite(cents) ? cents : 0;
  return (safe / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Parse a dollars string like "12.5" or "$1,200" into integer cents. */
export function dollarsToCents(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
