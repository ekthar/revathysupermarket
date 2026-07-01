/**
 * Utility helpers for report API routes.
 */

export type ReportPeriod = "week" | "month" | "quarter";

const PERIOD_DAYS: Record<ReportPeriod, number> = {
  week: 7,
  month: 30,
  quarter: 90,
};

/**
 * Compute a date range for report queries.
 * Returns null if the period string is invalid.
 *
 * - `start` is set to midnight UTC at the beginning of the range.
 * - `end` is set to 23:59:59.999 UTC today.
 */
export function getDateRange(
  period: string
): { start: Date; end: Date; periodStart: string; periodEnd: string } | null {
  if (!(period in PERIOD_DAYS)) return null;

  const days = PERIOD_DAYS[period as ReportPeriod];
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return {
    start,
    end,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

/**
 * Format a numeric value to exactly 2 decimal places as a string.
 */
export function to2dp(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return num.toFixed(2);
}
