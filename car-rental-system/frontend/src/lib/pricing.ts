// Pricing helpers — pure functions, fully testable, decoupled from React.

/**
 * Whole-day count between two YYYY-MM-DD strings.
 * Returns 0 for missing / invalid / non-positive ranges.
 */
export function daysBetween(pickup: string, returnDate: string): number {
  if (!pickup || !returnDate) return 0;
  const p = new Date(pickup);
  const r = new Date(returnDate);
  if (isNaN(p.getTime()) || isNaN(r.getTime())) return 0;
  const diff = Math.floor((r.getTime() - p.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

/**
 * Total cost = whole days × price per day.
 */
export function computeTotalCost(days: number, pricePerDay: number): number {
  if (days <= 0 || pricePerDay <= 0) return 0;
  return days * pricePerDay;
}

/**
 * Format an integer INR amount with Indian grouping (e.g., 6600 -> "₹6,600").
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Returns today's date as a YYYY-MM-DD string (local timezone).
 */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns the given ISO date plus `days` days, as YYYY-MM-DD.
 */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
