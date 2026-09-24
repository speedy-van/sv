/**
 * London timezone utilities using Intl — no @date-fns/tz required.
 *
 * All "date keys" are YYYY-MM-DD strings in Europe/London wall time.
 * Never use toISOString().split('T')[0] for user-facing dates; use these
 * instead so BST shifts are handled correctly.
 */

const TZ = 'Europe/London';

const londonDateParts = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // produces YYYY-MM-DD via en-CA locale

/** Returns the YYYY-MM-DD key for `date` in London time. */
export function toLondonDateKey(date: Date): string {
  return londonDateParts(date);
}

/** Returns today's YYYY-MM-DD key in London time. Pass `now` in tests. */
export function todayLondonKey(now: Date = new Date()): string {
  return londonDateParts(now);
}

/** Returns the YYYY-MM-DD key for `key` + `n` calendar days. */
export function addDaysToKey(key: string, n: number): string {
  // Parse as noon UTC to avoid any DST shift during arithmetic
  const [y, m, d] = key.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  base.setUTCDate(base.getUTCDate() + n);
  // Re-express via London formatter to handle month/year rollovers cleanly
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC', // already shifted; just format
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(base);
}

/** Returns day-of-week for a YYYY-MM-DD key: 0 = Sunday … 6 = Saturday. */
export function weekdayOfKey(key: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const [y, m, d] = key.split('-').map(Number);
  // new Date(y, m-1, d) interprets as local, but JS dates ignore that for getDay()
  // Use noon UTC to stay unambiguous.
  return new Date(Date.UTC(y, m - 1, d, 12)).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Converts a London wall-time (date key + hour + minute) to a UTC Date.
 * Use this to build `scheduledAt` for bookings.
 *
 * @param key    YYYY-MM-DD in London time
 * @param hour   Wall-clock hour (0–23) in London
 * @param minute Wall-clock minute (0–59)
 */
export function londonWallTimeToUtc(key: string, hour: number, minute: number): Date {
  const [y, m, d] = key.split('-').map(Number);

  // Build the candidate as if it were UTC, then adjust via Intl offset.
  // We use a two-step approach: guess UTC, check the London rendering, iterate.
  // In practice one correction step always suffices (DST offsets are ±1h max).
  const guess = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));

  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const adjust = (candidate: Date): Date => {
    const parts = fmt.formatToParts(candidate);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
    const lh = get('hour');
    const lm = get('minute');
    if (lh === hour && lm === minute) return candidate;
    // Offset: candidate rendered as london_hour:london_minute; we want hour:minute
    const diffMs = (hour - lh) * 60_000 * 60 + (minute - lm) * 60_000;
    return new Date(candidate.getTime() + diffMs);
  };

  return adjust(guess);
}
