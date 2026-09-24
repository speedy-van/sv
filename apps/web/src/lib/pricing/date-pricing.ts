/**
 * Date-factor pricing — mirrors WhoAndPaymentStep_Simple.buildPriceCalendar exactly
 * so the server price always matches what the calendar showed.
 *
 * Parity is tested by date-pricing.test.ts against 21 days of output.
 */
import { addDaysToKey, weekdayOfKey } from '@/lib/dates/london';

export const DATE_WINDOW_DAYS = 21;

/**
 * Returns the price multiplier for `dateKey` given that today is `todayKey`.
 * Both keys are YYYY-MM-DD strings in London time.
 *
 * daysAway = 0 → same-day (1.25×)
 * daysAway = 1 → next-day (1.15×)
 * daysAway 2–3 → 1.08×
 * daysAway 4–6 → 1.02×
 * daysAway 7–10 → 0.96×
 * daysAway 11–14 → 0.92×
 * daysAway 15+ → 0.90×
 * Saturday/Sunday → +0.05
 */
export function getDateFactor(dateKey: string, todayKey: string): number {
  const [ty, tm, td] = todayKey.split('-').map(Number);
  const [dy, dm, dd] = dateKey.split('-').map(Number);

  const todayMs = Date.UTC(ty, tm - 1, td);
  const dateMs = Date.UTC(dy, dm - 1, dd);
  const daysAway = Math.round((dateMs - todayMs) / 86_400_000);

  let factor: number;
  if (daysAway <= 0) {
    factor = 1.25;
  } else if (daysAway <= 1) {
    factor = 1.15;
  } else if (daysAway <= 3) {
    factor = 1.08;
  } else if (daysAway <= 6) {
    factor = 1.02;
  } else if (daysAway <= 10) {
    factor = 0.96;
  } else if (daysAway <= 14) {
    factor = 0.92;
  } else {
    factor = 0.90;
  }

  const dow = weekdayOfKey(dateKey);
  if (dow === 0 || dow === 6) factor += 0.05;

  return factor;
}

/**
 * Builds the full 21-day price array starting from todayKey.
 * Used by the quote service so all datePrices in a QuoteResponse are computed here.
 */
export function buildDatePrices(
  basePence: number,
  todayKey: string
): Array<{ dateKey: string; totalPence: number; cheapest: boolean }> {
  const entries = Array.from({ length: DATE_WINDOW_DAYS }, (_, i) => {
    const dateKey = i === 0 ? todayKey : addDaysToKey(todayKey, i);
    const factor = getDateFactor(dateKey, todayKey);
    return { dateKey, totalPence: Math.round(basePence * factor), cheapest: false };
  });

  const min = Math.min(...entries.map((e) => e.totalPence));
  // Mark all entries at the minimum as cheapest
  let cheapCount = 0;
  for (const e of entries) {
    if (e.totalPence === min && cheapCount < 3) {
      e.cheapest = true;
      cheapCount++;
    }
  }

  return entries;
}
